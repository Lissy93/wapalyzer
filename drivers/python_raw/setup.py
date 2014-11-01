from setuptools import setup

setup(
    name="wappalyzer",
    version="0.0.1",
    description="Python package for python_raw driver in Wappalyzer bundle",
    author="smant",
    author_email="TBA",
    url="https://github.com/chorsley/Wappalyzer/tree/master/drivers/python_raw",
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: GNU General Public License v3 (GPLv3)',
        'Programming Language :: Python :: 2.7',
        'Topic :: Internet :: WWW/HTTP',
    ],
    py_modules=['wappalyzer'],
    install_requires=[
    ],
    test_suite='nose.collector',
    tests_require=[
    ]
)
