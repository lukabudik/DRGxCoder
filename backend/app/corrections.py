"""Utilities for handling prediction corrections"""

from typing import List, Dict, Any
from loguru import logger


def build_corrected_secondary(
    original_codes: List[Dict[str, Any]], 
    corrections: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Apply corrections to secondary codes and return final list
    
    Args:
        original_codes: Original AI secondary diagnoses
            [{'code': 'E11', 'name': 'Diabetes', 'confidence': 0.85}, ...]
        corrections: List of changes from user
            [{'action': 'added'|'removed'|'modified', 'code': '...', 'name': '...', 'original_code': '...'}, ...]
    
    Returns:
        Final corrected list of secondary codes
    """
    logger.info(f"Building corrected secondary codes: {len(original_codes)} original, {len(corrections)} corrections")
    
    # Create a dictionary of current codes for easy lookup/modification
    current_codes = {code['code']: code for code in original_codes}
    result = []
    
    # Track which codes were handled by corrections
    handled_codes = set()
    
    # Apply corrections
    for correction in corrections:
        action = correction.get('action')
        code = correction.get('code')
        
        logger.debug(f"Processing correction: action={action}, code={code}")
        
        if action == 'removed':
            # Remove the code
            handled_codes.add(code)
            current_codes.pop(code, None)
            logger.debug(f"Removed code: {code}")
        
        elif action == 'added':
            # Add new code (user-added, no AI confidence)
            result.append({
                'code': code,
                'name': correction.get('name', ''),
                'confidence': 0.0,  # User-added, no AI confidence
                'reasoning': 'Added by user during correction',
            })
            handled_codes.add(code)
            logger.debug(f"Added code: {code}")
        
        elif action == 'modified':
            # Remove old code, add new one
            original_code = correction.get('original_code')
            if original_code:
                handled_codes.add(original_code)
                current_codes.pop(original_code, None)
            
            result.append({
                'code': code,
                'name': correction.get('name', ''),
                'confidence': 0.0,  # Modified, reset confidence
                'reasoning': f'Modified from {original_code}' if original_code else 'Modified by user',
            })
            handled_codes.add(code)
            logger.debug(f"Modified: {original_code} → {code}")
        
        elif action == 'kept':
            # Explicitly kept (no change needed, just continue)
            pass
    
    # Add remaining unmodified codes from original
    for code, data in current_codes.items():
        if code not in handled_codes:
            result.append(data)
    
    logger.info(f"Final corrected secondary codes: {len(result)} codes")
    return result
