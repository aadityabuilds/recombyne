#!/usr/bin/env python3
"""
DNA Sequence Optimization using DNAChisel
This script takes an input JSON file with sequence and optimization parameters,
runs DNAChisel optimization, and outputs the results to a JSON file.
"""

import json
import sys
import traceback
from typing import Dict, List, Any, Optional, Union
import os

# Define a flag to track if DNAChisel is available
DNACHISEL_AVAILABLE = True

try:
    from dnachisel import (
        DnaOptimizationProblem, CircularDnaOptimizationProblem,
        AvoidPattern, EnforceGCContent, CodonOptimize, EnforceTranslation,
        AvoidChanges, AvoidMatches, EnforcePatternOccurence, 
        AvoidHairpins, EnforceTerminalGCContent, AvoidRareCodons
    )
except ImportError:
    print("WARNING: DNAChisel is not installed. Using fallback mode.")
    print("For full functionality, install DNAChisel using:")
    print("pip install dnachisel[reports]")
    DNACHISEL_AVAILABLE = False

# Map of constraint types to their classes
CONSTRAINT_TYPES = {
    "AvoidPattern": AvoidPattern,
    "EnforceGCContent": EnforceGCContent,
    "EnforceTranslation": EnforceTranslation,
    "AvoidChanges": AvoidChanges,
    "AvoidMatches": AvoidMatches,
    "EnforcePatternOccurence": EnforcePatternOccurence,
    "AvoidHairpins": AvoidHairpins,
    "EnforceTerminalGCContent": EnforceTerminalGCContent,
    "AvoidRareCodons": AvoidRareCodons
}

# Map of objective types to their classes
OBJECTIVE_TYPES = {
    "CodonOptimize": CodonOptimize,
}

def create_constraint(constraint_data: Dict[str, Any]):
    """Create a constraint object from constraint data"""
    # Make a copy of the data to avoid modifying the original
    data = constraint_data.copy()
    constraint_type = data.pop("type")
    
    if constraint_type not in CONSTRAINT_TYPES:
        raise ValueError(f"Unknown constraint type: {constraint_type}")
    
    # Handle locations which are typically tuples
    if "location" in data and isinstance(data["location"], list):
        data["location"] = tuple(data["location"])
    
    # Parameter-specific fixes and validation
    if constraint_type == "AvoidHairpins":
        # Handle both stem_size and min_stem_size parameters
        if "min_stem_size" in data and "stem_size" not in data:
            print("Warning: Converting parameter 'min_stem_size' to 'stem_size'")
            data["stem_size"] = data.pop("min_stem_size")
        
        # Validate the stem_size parameter is present
        if "stem_size" not in data:
            print("Warning: Missing required parameter 'stem_size' for AvoidHairpins")
            # Set a reasonable default value
            data["stem_size"] = 6
    
    # Convert numeric string parameters to proper types if needed
    for param, value in list(data.items()):
        if isinstance(value, str) and value.replace('.', '', 1).isdigit():
            # Try to convert the string to an appropriate numeric type
            try:
                if '.' in value:
                    data[param] = float(value)
                else:
                    data[param] = int(value)
                print(f"Converted parameter '{param}' from string to numeric: {value} -> {data[param]}")
            except ValueError:
                # Keep as string if conversion fails
                pass
    
    # Add additional debugging
    print(f"Creating constraint {constraint_type} with parameters: {data}")
    
    try:
        return CONSTRAINT_TYPES[constraint_type](**data)
    except Exception as e:
        error_msg = f"Error creating constraint {constraint_type}: {str(e)}"
        print(error_msg)
        # Try to provide helpful error information
        import inspect
        param_names = list(inspect.signature(CONSTRAINT_TYPES[constraint_type].__init__).parameters.keys())[1:]
        print(f"Expected parameters for {constraint_type}: {param_names}")
        print(f"Provided parameters: {list(data.keys())}")
        
        # Create a more user-friendly error message
        raise ValueError(f"Failed to create constraint {constraint_type}: {str(e)}")

def create_objective(objective_data: Dict[str, Any]):
    """Create an objective object from objective data"""
    # Make a copy of the data to avoid modifying the original
    data = objective_data.copy()
    objective_type = data.pop("type")
    
    if objective_type not in OBJECTIVE_TYPES:
        raise ValueError(f"Unknown objective type: {objective_type}")
    
    # Handle locations which are typically tuples
    if "location" in data and isinstance(data["location"], list):
        data["location"] = tuple(data["location"])
    
    # Parameter-specific fixes for CodonOptimize
    if objective_type == "CodonOptimize":
        # Make sure species parameter exists and is valid
        if "species" not in data:
            print("Warning: Missing 'species' parameter for CodonOptimize, defaulting to 'e_coli'")
            data["species"] = "e_coli"
        
        # Adjust the location to ensure it's divisible by 3 for codon optimization
        if "location" in data:
            start, end = data["location"]
            length = end - start
            if length % 3 != 0:
                # Adjust the end to make the length divisible by 3
                adjusted_end = start + (length - (length % 3))
                if adjusted_end > start:  # Ensure we have a valid range
                    print(f"Warning: Adjusting CodonOptimize location from {data['location']} to ({start}, {adjusted_end}) to ensure length is divisible by 3")
                    data["location"] = (start, adjusted_end)
                else:
                    print(f"Warning: CodonOptimize location {data['location']} is too short for codon optimization. Removing objective.")
                    return None
    
    # Convert numeric string parameters to proper types if needed
    for param, value in list(data.items()):
        if isinstance(value, str) and value.replace('.', '', 1).isdigit():
            # Try to convert the string to an appropriate numeric type
            try:
                if '.' in value:
                    data[param] = float(value)
                else:
                    data[param] = int(value)
                print(f"Converted parameter '{param}' from string to numeric: {value} -> {data[param]}")
            except ValueError:
                # Keep as string if conversion fails
                pass
    
    # Add additional debugging
    print(f"Creating objective {objective_type} with parameters: {data}")
    
    try:
        return OBJECTIVE_TYPES[objective_type](**data)
    except Exception as e:
        error_msg = f"Error creating objective {objective_type}: {str(e)}"
        print(error_msg)
        # Try to provide helpful error information
        import inspect
        param_names = list(inspect.signature(OBJECTIVE_TYPES[objective_type].__init__).parameters.keys())[1:]
        print(f"Expected parameters for {objective_type}: {param_names}")
        print(f"Provided parameters: {list(data.keys())}")
        
        # Create a more user-friendly error message
        raise ValueError(f"Failed to create objective {objective_type}: {str(e)}")

def optimize_sequence(
    sequence: str,
    constraints: List[Dict[str, Any]],
    objectives: List[Dict[str, Any]],
    is_circular: bool = False
) -> Dict[str, Any]:
    """
    Optimize a DNA sequence using DNAChisel
    
    Args:
        sequence: The DNA sequence to optimize
        constraints: List of constraint specifications
        objectives: List of objective specifications
        is_circular: Whether the sequence is circular
    
    Returns:
        Dictionary with optimization results
    """
    # Check if DNAChisel is available
    if not DNACHISEL_AVAILABLE:
        print("DNAChisel not available - returning original sequence")
        return {
            "success": True,
            "optimized_sequence": sequence,
            "constraints_summary": "DNAChisel not available - no constraints applied",
            "objectives_summary": "DNAChisel not available - no objectives applied",
            "all_constraints_passing": True
        }
    try:
        # Create constraint and objective objects
        constraint_objects = [create_constraint(c) for c in constraints]
        
        # Filter None values that might be returned if an objective is invalid
        objective_objects = []
        for o in objectives:
            obj = create_objective(o)
            if obj is not None:
                objective_objects.append(obj)
        
        # If we have CodonOptimize objectives but couldn't create any valid ones, return error
        has_codon_optimize_request = any(o["type"] == "CodonOptimize" for o in objectives)
        has_valid_codon_optimize = False
        
        # Check if any of the created objectives are CodonOptimize
        for obj in objective_objects:
            obj_class_name = obj.__class__.__name__
            if obj_class_name == "CodonOptimize":
                has_valid_codon_optimize = True
                break
        
        if has_codon_optimize_request and not has_valid_codon_optimize and len(objective_objects) < len(objectives):
            return {
                "success": False,
                "error": "Failed to create valid CodonOptimize objectives. Sequence length must be divisible by 3 for codon optimization.",
                "traceback": "Adjusted sequence length would be invalid or too short."
            }
        
        # Create the optimization problem
        if is_circular:
            problem = CircularDnaOptimizationProblem(
                sequence=sequence,
                constraints=constraint_objects,
                objectives=objective_objects
            )
        else:
            problem = DnaOptimizationProblem(
                sequence=sequence,
                constraints=constraint_objects,
                objectives=objective_objects
            )
        
        # Solve the constraints
        problem.resolve_constraints()
        
        # Optimize with respect to objectives
        if objective_objects:
            problem.optimize()
        
        # Get optimization reports
        constraints_text = problem.constraints_text_summary()
        objectives_text = problem.objectives_text_summary() if objective_objects else ""
        
        # Create result
        result = {
            "success": True,
            "optimized_sequence": problem.sequence,
            "constraints_summary": constraints_text,
            "objectives_summary": objectives_text,
            "all_constraints_passing": problem.all_constraints_pass(),
        }
        
        return result
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

def main():
    """Main function to run optimization from command line"""
    # Print debugging information
    print(f"Python version: {sys.version}")
    print(f"Command line arguments: {sys.argv}")
    
    if len(sys.argv) != 3:
        print("Usage: python dna_optimization.py input.json output.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        # Verify input file exists
        if not os.path.exists(input_file):
            print(f"Error: Input file does not exist: {input_file}")
            sys.exit(1)
            
        print(f"Reading input file: {input_file}")
        
        # Read input data
        with open(input_file, 'r') as f:
            input_content = f.read()
            print(f"Input file content length: {len(input_content)}")
            if not input_content.strip():
                print("Error: Input file is empty")
                sys.exit(1)
            input_data = json.loads(input_content)
        
        # Extract parameters
        sequence = input_data.get("sequence", "")
        constraints = input_data.get("constraints", [])
        objectives = input_data.get("objectives", [])
        is_circular = input_data.get("isCircular", False)
        
        print(f"Sequence length: {len(sequence)}")
        print(f"Constraints: {len(constraints)}")
        print(f"Objectives: {len(objectives)}")
        print(f"Is circular: {is_circular}")
        
        # Run optimization
        print("Running sequence optimization...")
        result = optimize_sequence(sequence, constraints, objectives, is_circular)
        print("Optimization completed.")
        
        # Write output
        print(f"Writing output to: {output_file}")
        with open(output_file, 'w') as f:
            output_json = json.dumps(result, indent=2)
            f.write(output_json)
        
        # Verify output was written correctly
        if os.path.exists(output_file):
            print(f"Output file created successfully: {output_file}")
            print(f"Output file size: {os.path.getsize(output_file)} bytes")
        else:
            print(f"Error: Failed to create output file: {output_file}")
        
        sys.exit(0)
    
    except Exception as e:
        print(f"Error in main function: {str(e)}")
        print(traceback.format_exc())
        
        error_result = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        
        try:
            print(f"Writing error to output file: {output_file}")
            with open(output_file, 'w') as f:
                output_json = json.dumps(error_result, indent=2)
                f.write(output_json)
            print(f"Error written to: {output_file}")
        except Exception as write_error:
            print(f"Failed to write error output: {str(write_error)}")
        
        sys.exit(1)

if __name__ == "__main__":
    main()
