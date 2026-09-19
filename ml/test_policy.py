from datetime import datetime
from app import SafeWindow, safe_window

def test_tomato_peak_after_safe_date():
    data = SafeWindow(usable_until=datetime(2026,9,3,23),condition="known",
        collection_hours=6,travel_hours=8,candidate_dates=[datetime(2026,9,2),datetime(2026,9,7)])
    assert safe_window(data)["allowed"] == ["2026-09-02T00:00:00"]

def test_unknown_condition_does_not_justify_waiting():
    data = SafeWindow(collection_hours=0,travel_hours=0,candidate_dates=[datetime(2026,9,2)])
    assert safe_window(data)["reason"] == "MISSING_CONDITIONS"

