-- TutoReels Launcher
--
-- Double-click the compiled .app (on the Desktop) to:
--   1. Check if the TutoReels dev server is already running on port 3000.
--   2. If not, start `npm run dev` in the background.
--   3. Wait (up to 60s) for the server to respond.
--   4. Show a dialog with a clickable "Open in Browser" button.
--      The dialog stays open until you click "Close".
--
-- The dev server auto-shuts-down when the browser tab closes or the user
-- is idle for 15 minutes (handled by instrumentation.ts + useHeartbeat).
--
-- Build: `npm run setup` does this automatically on macOS. Or manually:
--   osacompile -o ~/Desktop/TutoReels.app scripts/tutoreels-launcher.applescript
--
-- NOTE: `projectPath` below is rewritten by scripts/setup.mjs to the
-- absolute path of the cloned repo on each machine before compiling.

property projectPath : "__TUTOREELS_PROJECT_PATH__"
property serverUrl : "http://localhost:3000"
property logFile : "/tmp/tutoreels-dev.log"
property maxStartupSeconds : 60

on run
	try
		if not isServerUp() then
			startServer()
			if not waitForServer(maxStartupSeconds) then
				display dialog ¬
					"TutoReels failed to start within " & maxStartupSeconds & " seconds." & return & return & ¬
					"Check the log at:" & return & logFile ¬
					with title "TutoReels" ¬
					buttons {"Open Log", "OK"} default button "OK" ¬
					with icon stop
				if button returned of result is "Open Log" then
					do shell script "open -t " & quoted form of logFile
				end if
				return
			end if
		end if

		-- Loop dialog: clicking "Open in Browser" opens the URL but keeps the
		-- dialog open. Clicking "Close" exits. This matches the requested flow.
		repeat
			set dlg to display dialog ¬
				"✓ TutoReels is running" & return & return & ¬
				serverUrl & return & return & ¬
				"Click ‘Open in Browser’ to launch, then ‘Close’ when you're done." ¬
				with title "TutoReels" ¬
				buttons {"Close", "Open in Browser"} ¬
				default button "Open in Browser" ¬
				with icon note
			if button returned of dlg is "Close" then exit repeat
			do shell script "open " & quoted form of serverUrl
		end repeat
	on error errMsg number errNum
		if errNum is -128 then return -- user cancelled (Cmd+. or Esc)
		display dialog "TutoReels launcher error:" & return & return & errMsg ¬
			with title "TutoReels" ¬
			buttons {"OK"} default button "OK" ¬
			with icon stop
	end try
end run

-- True if something on http://localhost:3000 is responding.
on isServerUp()
	try
		do shell script "curl -s -o /dev/null --max-time 2 --connect-timeout 2 " & quoted form of serverUrl
		return true
	on error
		return false
	end try
end isServerUp

-- Start `npm run dev` in the background, fully detached from this process.
on startServer()
	set shellCmd to "cd " & quoted form of projectPath & " && " & ¬
		"export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH && " & ¬
		"( nohup npm run dev > " & quoted form of logFile & " 2>&1 < /dev/null & )"
	do shell script shellCmd
end startServer

-- Poll isServerUp() once per second until it succeeds or we hit maxSeconds.
on waitForServer(maxSeconds)
	set elapsed to 0
	repeat while elapsed < maxSeconds
		if isServerUp() then return true
		delay 1
		set elapsed to elapsed + 1
	end repeat
	return false
end waitForServer
