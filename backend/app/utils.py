"""Utility functions"""

from datetime import datetime


def calculate_age(date_of_birth: datetime) -> int:
    """Calculate age in years from date of birth"""
    today = datetime.now()
    age = today.year - date_of_birth.year
    
    # Adjust if birthday hasn't occurred this year yet
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        age -= 1
    
    return age
