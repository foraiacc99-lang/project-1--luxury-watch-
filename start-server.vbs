' Launches the RM 50-03 dev server silently (no console window) on http://localhost:3000
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "c:\Users\Swaraj Talekar\OneDrive\Desktop\web dev\project-1 (luxury watch)"
sh.Run "node serve.mjs", 0, False
