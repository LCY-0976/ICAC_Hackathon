from setuptools import setup, Extension
import subprocess
import sys

# Get pybind11 includes
try:
    import pybind11
    include_dirs = [pybind11.get_include()]
    print(f"Found pybind11 at: {pybind11.get_include()}")
except ImportError:
    print("Error: pybind11 not found")
    include_dirs = []

ext_modules = [
    Extension(
        "blockchain",
        sources=["blockchain.cpp"],
        include_dirs=include_dirs,
        language='c++',
        extra_compile_args=['-std=c++14', '-fPIC'],
    ),
]

setup(
    name="blockchain",
    ext_modules=ext_modules,
    zip_safe=False,
) 