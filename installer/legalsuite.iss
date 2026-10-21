; legalsuite Inno Setup 6 script (unsigned .exe; SmartScreen warns until signed).
; Build on Windows: iscc installer\legalsuite.iss  -> dist\legalsuite-setup-2.0.0.exe
#define MyAppVersion "2.0.0"

[Setup]
AppName=legalsuite
AppVersion={#MyAppVersion}
DefaultDirName={autopf}\legalsuite
DefaultGroupName=legalsuite
OutputDir=dist
OutputBaseFilename=legalsuite-setup-{#MyAppVersion}
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
UninstallDisplayName=legalsuite {#MyAppVersion} (unsigned build)
WizardStyle=modern

[Files]
Source: "..\skills\*"; DestDir: "{app}\skills"; Flags: recursesubdirs
Source: "..\commands\*"; DestDir: "{app}\commands"; Flags: recursesubdirs
Source: "..\scripts\*"; DestDir: "{app}\scripts"; Flags: recursesubdirs
Source: "..\playbooks\README.md"; DestDir: "{app}\playbooks"
Source: "..\playbooks\_template.md"; DestDir: "{app}\playbooks"
Source: "..\playbooks\_template-intake-matrix.md"; DestDir: "{app}\playbooks"
Source: "..\install.ps1"; DestDir: "{app}"
Source: "..\install.sh"; DestDir: "{app}"

[Icons]
Name: "{group}\Install legalsuite"; Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\install.ps1"""

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\install.ps1"" -Yes"; Flags: postinstall skipifsilent runasoriginaluser; Description: "Run installer now (auto runtime, unsigned build)"

[Code]
function InitializeSetup(): Boolean;
begin
  MsgBox('Unsigned build: Windows SmartScreen will warn until a code-signing certificate exists.', mbInformation, MB_OK);
  Result := True;
end;
