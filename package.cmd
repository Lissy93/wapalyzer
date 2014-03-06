::	package.cmd
::	Copyright (c) 2012-2014 q-- <https://github.com/q-->
::	
::	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
::	
::	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
::	
::	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
@echo off

::Links
call links.cmd

::Remove old packages
if exist wappalyzer-chrome.zip del wappalyzer-chrome.zip
if exist wappalyzer-firefox.xpi del wappalyzer-firefox.xpi

::Check if where.exe is present
where.exe /Q cmd.exe
IF NOT %ERRORLEVEL%==0 GOTO noWhere

::Check for 7-Zip
where.exe 7z.exe
IF %ERRORLEVEL%==0 GOTO sevenZipIsInPath

::Ok, WHERE can't find 7-Zip. Check at the default install location
IF EXIST "C:\Program Files\7-zip\7z.exe" (
	set zip="C:\Program Files\7-zip\7z.exe"
	GOTO Package
) ELSE (
	echo.7-Zip was not found.
	echo.Please download 7-Zip from http://7-zip.org/ and add 7z.exe ^(the command-line edition^) to PATH.
	pause
	goto :end
)


::WHERE command isn't found. Try it anyway.
::(WHERE is present by default in Vista and newer, older Windows versions require that you install it yourself.)
:noWhere
echo.WHERE.exe was not found on your system.
echo.If the script fails, please download 7-Zip from http://7-zip.org/ and add 7z.exe (the command-line edition) to PATH.


::7-Zip command line is found in PATH
:sevenZipIsInPath
set zip=7z.exe


:Package
::Pack Chrome extension
cd drivers\chrome&&%zip% a -tzip -mx9 ..\..\wappalyzer-chrome.zip *
cd..\..

::Pack Firefox extension
::cd drivers\firefox&&%zip% a -tzip -mx9 ..\..\wappalyzer-firefox.xpi *
::cd..\..


:end
@echo on
