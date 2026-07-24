Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d ""D:\TEKNOLOGI INFORMASI\Magang\ResiApp\backend"" && node src\app.js > backend.log 2>&1", 0, False
