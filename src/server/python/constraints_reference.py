"""
DNAChisel Constraints and Objectives Parameters Reference

This file serves as a reference for parameter names used in DNAChisel constraints
and objectives. It helps ensure we use the correct parameter names in our UI.
"""

# AvoidPattern
# - pattern: Pattern to avoid (string or regex)
# - location: Location where the constraint applies (default: whole sequence)

# EnforceGCContent
# - mini: Minimum GC content (float)
# - maxi: Maximum GC content (float)
# - window: Window size to check GC content (int)
# - location: Location where the constraint applies (default: whole sequence)

# AvoidHairpins
# - stem_size: Size of the hairpin stem (int) - NOT min_stem_size
# - hairpin_window: Window to consider for hairpins (int)
# - location: Location where the constraint applies (default: whole sequence)

# EnforceTranslation
# - location: Location of the coding sequence
# - translation: Target amino acid sequence (if not provided, preserves original)

# AvoidChanges
# - location: Location where changes should be avoided
# - reference: Reference sequence

# AvoidMatches
# - matches_sequences: List of sequences to avoid matches with
# - location: Location where the constraint applies

# EnforcePatternOccurence
# - pattern: Pattern to enforce (string or regex)
# - location: Location where the constraint applies
# - occurences: Number of occurrences to enforce (default: 1)

# EnforceTerminalGCContent
# - mini: Minimum terminal GC content
# - maxi: Maximum terminal GC content
# - window: Window size for terminal GC content

# AvoidRareCodons
# - species: Species to avoid rare codons for
# - location: Location of the coding sequence
# - threshold: Rarity threshold

# CodonOptimize
# - species: Species to optimize codons for
# - location: Location of the coding sequence

# Common Parameters
# - boost: Boost factor for the constraint/objective
# - name: Custom name for the constraint/objective
