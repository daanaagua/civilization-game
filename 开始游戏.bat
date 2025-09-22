@echo off
chcp 65001 >nul
title 文明演进 - 启动器
echo ==========================================
echo  文明演进 启动器
echo  本脚本将自动安装依赖并启动游戏
echo ==========================================
echo.

REM 1) 检查 Node 和 npm
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo 未检测到 Node.js，尝试通过 winget 安装 LTS 版本...
  where winget >nul 2>nul
  if %errorlevel% neq 0 (
    echo 本机未安装 winget，请先安装 Node.js (LTS) 后重试：
    echo 下载地址：https://nodejs.org/zh-cn
    pause
    exit /b 1
  )
  echo 将开始安装，请在弹出的窗口中确认许可...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  if %errorlevel% neq 0 (
    echo Node.js 安装失败，请手动安装后重试：
    echo https://nodejs.org/zh-cn
    pause
    exit /b 1
  )
)

echo.
echo Node.js 已准备好，开始安装项目依赖...
REM 2) 安装依赖（优先使用 npm ci）
if exist package-lock.json (
  call npm ci
) else (
  call npm install
)
if %errorlevel% neq 0 (
  echo 依赖安装失败，请检查网络或权限。
  pause
  exit /b 1
)

echo.
echo 启动开发服务器（npm run dev）...
REM 3) 启动开发服务器到新窗口
start "文明演进 Dev Server" cmd /c "npm run dev"

REM 4) 等待端口 3000 就绪并自动打开浏览器
echo 等待服务就绪(http://localhost:3000)...
powershell -NoProfile -Command ^
  "$url='http://localhost:3000';" ^
  "for($i=0;$i -lt 60;$i++){" ^
  "  try { $r=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1; if($r.StatusCode -ge 200){ Start-Process $url; break } } catch {}" ^
  "  Start-Sleep -Seconds 2" ^
  "};"

echo.
echo 如果浏览器没有自动打开，请手动访问：http://localhost:3000
echo 祝你游戏愉快！
pause