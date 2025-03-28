#!/usr/bin/env python3
"""
Debug script to test DNA optimization directly
"""

import json
import os
import sys
import tempfile
from dna_optimization import optimize_sequence

# Simple test sequence
TEST_SEQUENCE = "ATGCAGTACGTAGCTGATCGATGCTAGCGTAGCTGATCGTGCTAGTCAGTCGATGCTATGCTGATGCTAGTCGATGCATGCGTAGCATGCGTAGCTAGCTAGCGATGCTA"

def test_basic_optimization():
    """Test basic optimization with GC content constraint"""
    print("\n=== Testing Basic Optimization ===")
    result = optimize_sequence(
        sequence=TEST_SEQUENCE,
        constraints=[
            {
                "type": "EnforceGCContent",
                "mini": 0.4,
                "maxi": 0.6,
                "window": 50
            }
        ],
        objectives=[],
        is_circular=False
    )
    print(f"Success: {result['success']}")
    if not result['success']:
        print(f"Error: {result.get('error')}")
        print(f"Traceback: {result.get('traceback')}")
    else:
        print(f"Optimized sequence length: {len(result['optimized_sequence'])}")
        print(f"Constraints summary: {result['constraints_summary']}")
    return result['success']

def test_avoid_hairpins():
    """Test optimization with AvoidHairpins constraint"""
    print("\n=== Testing AvoidHairpins ===")
    result = optimize_sequence(
        sequence=TEST_SEQUENCE,
        constraints=[
            {
                "type": "AvoidHairpins",
                "stem_size": 6,
                "hairpin_window": 200
            }
        ],
        objectives=[],
        is_circular=False
    )
    print(f"Success: {result['success']}")
    if not result['success']:
        print(f"Error: {result.get('error')}")
        print(f"Traceback: {result.get('traceback')}")
    else:
        print(f"Optimized sequence length: {len(result['optimized_sequence'])}")
        print(f"Constraints summary: {result['constraints_summary']}")
    return result['success']

def test_codon_optimize():
    """Test optimization with CodonOptimize objective"""
    print("\n=== Testing CodonOptimize ===")
    result = optimize_sequence(
        sequence=TEST_SEQUENCE,
        constraints=[],
        objectives=[
            {
                "type": "CodonOptimize",
                "species": "e_coli",
                "location": [0, len(TEST_SEQUENCE)]
            }
        ],
        is_circular=False
    )
    print(f"Success: {result['success']}")
    if not result['success']:
        print(f"Error: {result.get('error')}")
        print(f"Traceback: {result.get('traceback')}")
    else:
        print(f"Optimized sequence length: {len(result['optimized_sequence'])}")
        print(f"Objectives summary: {result['objectives_summary']}")
    return result['success']

def test_avoid_pattern():
    """Test optimization with AvoidPattern constraint"""
    print("\n=== Testing AvoidPattern ===")
    result = optimize_sequence(
        sequence=TEST_SEQUENCE,
        constraints=[
            {
                "type": "AvoidPattern",
                "pattern": "BsaI_site"
            }
        ],
        objectives=[],
        is_circular=False
    )
    print(f"Success: {result['success']}")
    if not result['success']:
        print(f"Error: {result.get('error')}")
        print(f"Traceback: {result.get('traceback')}")
    else:
        print(f"Optimized sequence length: {len(result['optimized_sequence'])}")
        print(f"Constraints summary: {result['constraints_summary']}")
    return result['success']

def test_combined_constraints():
    """Test optimization with multiple constraints"""
    print("\n=== Testing Combined Constraints ===")
    result = optimize_sequence(
        sequence=TEST_SEQUENCE,
        constraints=[
            {
                "type": "EnforceGCContent",
                "mini": 0.4,
                "maxi": 0.6,
                "window": 50
            },
            {
                "type": "AvoidPattern",
                "pattern": "BsaI_site"
            },
            {
                "type": "AvoidHairpins",
                "stem_size": 6,
                "hairpin_window": 200
            }
        ],
        objectives=[
            {
                "type": "CodonOptimize",
                "species": "e_coli",
                "location": [0, len(TEST_SEQUENCE)]
            }
        ],
        is_circular=False
    )
    print(f"Success: {result['success']}")
    if not result['success']:
        print(f"Error: {result.get('error')}")
        print(f"Traceback: {result.get('traceback')}")
    else:
        print(f"Optimized sequence length: {len(result['optimized_sequence'])}")
        print(f"Constraints summary: {result['constraints_summary']}")
        print(f"Objectives summary: {result['objectives_summary']}")
    return result['success']

if __name__ == "__main__":
    print("Running DNA Chisel debug tests...")
    
    # Run all tests
    test_basic_optimization()
    test_avoid_hairpins()
    test_codon_optimize()
    test_avoid_pattern()
    test_combined_constraints()
    
    print("\nAll tests completed.") 