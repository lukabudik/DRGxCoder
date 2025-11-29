import csv
import re
import os
from typing import Tuple, Dict, List
from collections import defaultdict

def expand_medical_abbreviations(text: str, csv_path: str = None) -> Tuple[str, Dict[str, str]]:
    """
    Expands medical abbreviations in the given text based on a CSV file.
    
    The function is case-insensitive regarding the abbreviations in the input text.
    It returns the expanded text and a dictionary of the abbreviations that were found and expanded.
    
    Args:
        text: The input string containing medical abbreviations.
        csv_path: Path to the 'medical_abbreviations.csv' file. 
                  If None, defaults to 'input/medical_abbreviations.csv' relative to this script.
                  
    Returns:
        A tuple containing:
        - The text with abbreviations expanded.
        - A dictionary mapping the canonical abbreviation (from CSV) to its description.
    """
    
    if csv_path is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, 'medical_abbreviations.csv')
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found at: {csv_path}")

    # Dictionary to store lowercase_abbrev -> list of descriptions
    abbrev_map: Dict[str, List[str]] = defaultdict(list)
    # Dictionary to store lowercase_abbrev -> canonical abbreviation (original case from CSV)
    canonical_map: Dict[str, str] = {}

    try:
        with open(csv_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                abbrev_raw = row['Abbreviation']
                description = row['Description']
                
                if not abbrev_raw or not description:
                    continue
                
                # Handle cases like "SONO, USG" where multiple aliases are in one column
                # We split by comma if present.
                aliases = [a.strip() for a in abbrev_raw.split(',')]
                
                for alias in aliases:
                    if not alias:
                        continue
                    
                    lower_alias = alias.lower()
                    abbrev_map[lower_alias].append(description.strip())
                    
                    # Store the first encountered casing as canonical, or overwrite (doesn't matter much)
                    if lower_alias not in canonical_map:
                        canonical_map[lower_alias] = alias
                        
    except Exception as e:
        raise RuntimeError(f"Error reading CSV file: {e}")

    # Sort abbreviations by length (descending) to ensure longest match first
    # e.g., match "BiV (KS)" before "BiV"
    sorted_keys = sorted(abbrev_map.keys(), key=len, reverse=True)
    
    if not sorted_keys:
        return text, {}

    # Create a regex pattern
    # We use lookbehind (?<!\w) and lookahead (?!\w) to match whole words/tokens
    # We escape the keys to handle special characters like '.', '(', ')'
    pattern_str = '|'.join(r'(?<!\w)' + re.escape(key) + r'(?!\w)' for key in sorted_keys)
    try:
        pattern = re.compile(pattern_str, re.IGNORECASE)
    except re.error as e:
        # Fallback or error if pattern is too complex (unlikely with 672 items)
        raise RuntimeError(f"Failed to compile regex pattern: {e}")

    used_abbrevs: Dict[str, str] = {}

    def replace_func(match):
        matched_text = match.group()
        lower_key = matched_text.lower()
        
        if lower_key in abbrev_map:
            descriptions = abbrev_map[lower_key]
            # Join multiple descriptions if they exist (e.g. AMI -> amikacin / arteria ...)
            expanded_desc = " / ".join(descriptions)
            
            # Record usage using the canonical abbreviation
            canonical_key = canonical_map.get(lower_key, matched_text)
            used_abbrevs[canonical_key] = expanded_desc
            
            return expanded_desc
        return matched_text

    expanded_text = pattern.sub(replace_func, text)
    
    return expanded_text, used_abbrevs

if __name__ == "__main__":
    # Example usage
    sample_text = "Pacient s FiS a AMI byl odeslán na SONO. Stav po TEP."
    print(f"Original: {sample_text}")
    
    try:
        expanded, used = expand_medical_abbreviations(sample_text)
        print(f"Expanded: {expanded}")
        print("Used Abbreviations:")
        for k, v in used.items():
            print(f"  {k}: {v}")
    except Exception as e:
        print(f"Error: {e}")
