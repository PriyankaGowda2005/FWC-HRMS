@echo off
echo ===============================================
echo FWC-HRMS Network Issue Diagnosis
echo ===============================================
echo.

echo [1/8] Checking system status...
echo.

echo Checking Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ Node.js processes found:
    tasklist /FI "IMAGENAME eq node.exe"
) else (
    echo ❌ No Node.js processes found
)

echo.
echo Checking MongoDB processes...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ MongoDB is running
) else (
    echo ❌ MongoDB is not running
)

echo.
echo [2/8] Checking port availability...
echo.

echo Checking port 3001 (Backend)...
netstat -an | findstr :3001
if "%ERRORLEVEL%"=="0" (
    echo ✅ Port 3001 is in use (Backend should be running)
) else (
    echo ❌ Port 3001 is free (Backend not running)
)

echo.
echo Checking port 5174 (Frontend)...
netstat -an | findstr :5174
if "%ERRORLEVEL%"=="0" (
    echo ✅ Port 5174 is in use (Frontend should be running)
) else (
    echo ❌ Port 5174 is free (Frontend not running)
)

echo.
echo [3/8] Testing backend connectivity...
echo.

echo Testing backend health endpoint...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/health' -UseBasicParsing; Write-Host '✅ Backend health check passed - Status:' $response.StatusCode; Write-Host 'Response:' $response.Content } catch { Write-Host '❌ Backend health check failed:' $_.Exception.Message }"

echo.
echo Testing API health endpoint...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing; Write-Host '✅ API health check passed - Status:' $response.StatusCode; Write-Host 'Response:' $response.Content } catch { Write-Host '❌ API health check failed:' $_.Exception.Message }"

echo.
echo [4/8] Testing CORS configuration...
echo.

echo Testing CORS with frontend origin...
powershell -Command "try { $headers = @{'Origin'='http://localhost:5174'; 'Referer'='http://localhost:5174/'}; $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/health' -UseBasicParsing -Headers $headers; Write-Host '✅ CORS test passed - Status:' $response.StatusCode; Write-Host 'CORS Headers:' $response.Headers } catch { Write-Host '❌ CORS test failed:' $_.Exception.Message }"

echo.
echo [5/8] Checking firewall and security...
echo.

echo Checking Windows Firewall status...
netsh advfirewall show allprofiles state 2>nul | findstr "State"
if "%ERRORLEVEL%"=="0" (
    echo ✅ Windows Firewall status retrieved
) else (
    echo ⚠️ Could not check Windows Firewall status
)

echo.
echo [6/8] Checking backend configuration...
echo.

echo Checking backend server.js...
if exist "apps\backend\src\server.js" (
    echo ✅ Backend server.js exists
    echo Checking CORS configuration...
    findstr /C:"localhost:5174" "apps\backend\src\server.js" >nul
    if "%ERRORLEVEL%"=="0" (
        echo ✅ CORS includes localhost:5174
    ) else (
        echo ❌ CORS does not include localhost:5174
    )
) else (
    echo ❌ Backend server.js not found
)

echo.
echo [7/8] Checking frontend configuration...
echo.

echo Checking frontend vite.config.js...
if exist "apps\frontend\vite.config.js" (
    echo ✅ Frontend vite.config.js exists
    echo Checking port configuration...
    findstr /C:"port: 5174" "apps\frontend\vite.config.js" >nul
    if "%ERRORLEVEL%"=="0" (
        echo ✅ Frontend configured for port 5174
    ) else (
        echo ❌ Frontend not configured for port 5174
    )
) else (
    echo ❌ Frontend vite.config.js not found
)

echo.
echo Checking frontend API configuration...
if exist "apps\frontend\src\services\api.js" (
    echo ✅ Frontend API service exists
    echo Checking API base URL...
    findstr /C:"localhost:3001" "apps\frontend\src\services\api.js" >nul
    if "%ERRORLEVEL%"=="0" (
        echo ✅ API configured for localhost:3001
    ) else (
        echo ❌ API not configured for localhost:3001
    )
) else (
    echo ❌ Frontend API service not found
)

echo.
echo [8/8] Recommendations...
echo.

echo Based on the diagnosis above, here are the recommendations:
echo.
echo 1. If backend is not running:
echo    - Start backend: cd apps\backend ^&^& npm start
echo.
echo 2. If frontend is not running:
echo    - Start frontend: cd apps\frontend ^&^& npm run dev -- --port 5174
echo.
echo 3. If MongoDB is not running:
echo    - Start MongoDB: mongod --dbpath C:\data\db
echo.
echo 4. If CORS issues:
echo    - Check backend server.js CORS configuration
echo    - Ensure localhost:5174 is included in allowed origins
echo.
echo 5. If firewall blocking:
echo    - Add firewall exception for Node.js
echo    - Allow ports 3001 and 5174 through firewall
echo.
echo 6. Test with browser:
echo    - Open test-connection.html in browser
echo    - Run all connection tests
echo.

echo ===============================================
echo Diagnosis Complete!
echo ===============================================
echo.
echo Next steps:
echo 1. Review the results above
echo 2. Fix any issues identified
echo 3. Restart the affected services
echo 4. Test the connection again
echo.
pause
