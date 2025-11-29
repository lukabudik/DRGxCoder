import json
import argparse
import csv
import os
from typing import List, Dict, Any

def main():
    parser = argparse.ArgumentParser(description="Convert DRG JSON results to CSV")
    parser.add_argument("input_file", help="Input JSON file path")
    parser.add_argument("--only_codes", action="store_true", help="Include only diagnosis codes, excluding names")
    parser.add_argument("--remove_dots", action="store_true", help="Remove dots from diagnosis codes")
    
    args = parser.parse_args()
    
    try:
        with open(args.input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file '{args.input_file}' not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: Failed to decode JSON from '{args.input_file}'.")
        return

    # Define headers
    headers = ["patient id", "main diagnosis code"]
    if not args.only_codes:
        headers.append("main diagnosis name")

    for i in range(1, 15):
        headers.append(f"secondary diagnosis {i} code")
        if not args.only_codes:
            headers.append(f"secondary diagnosis {i} name")

    rows = []
    for item in data:
        patient_id = item.get("patient_id")
        analysis = item.get("drg_analysis", {})
        
        row = {}
        
        # Handle cases where analysis might be an error dict
        if "error" in analysis:
            row["patient id"] = patient_id
            row["main diagnosis code"] = "ERROR"
            if not args.only_codes:
                row["main diagnosis name"] = analysis.get("error")
            # Fill empty for secondary diagnoses
            for i in range(1, 15):
                row[f"secondary diagnosis {i} code"] = ""
                if not args.only_codes:
                    row[f"secondary diagnosis {i} name"] = ""
            rows.append(row)
            continue

        main_diag = analysis.get("main_diagnosis", {})
        secondary_diags = analysis.get("secondary_diagnoses", [])
        
        row["patient id"] = patient_id
        
        main_code = main_diag.get("code", "")
        if args.remove_dots:
            main_code = main_code.replace(".", "")
        row["main diagnosis code"] = main_code
        
        if not args.only_codes:
            row["main diagnosis name"] = main_diag.get("name", "")

        for i in range(1, 15):
            if i <= len(secondary_diags):
                diag = secondary_diags[i-1]
                sec_code = diag.get("code", "")
                if args.remove_dots:
                    sec_code = sec_code.replace(".", "")
                row[f"secondary diagnosis {i} code"] = sec_code
                if not args.only_codes:
                    row[f"secondary diagnosis {i} name"] = diag.get("name", "")
            else:
                row[f"secondary diagnosis {i} code"] = ""
                if not args.only_codes:
                    row[f"secondary diagnosis {i} name"] = ""
        
        rows.append(row)

    # Generate output filename based on input filename
    base_name = os.path.splitext(os.path.basename(args.input_file))[0]
    output_file = f"{base_name}.csv"
    
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)
        print(f"Converted {len(rows)} records to '{output_file}'")
    except IOError as e:
        print(f"Error writing to file '{output_file}': {e}")

if __name__ == "__main__":
    main()
