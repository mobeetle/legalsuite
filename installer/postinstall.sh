#!/bin/sh
# nFPM postinstall: unsigned build notice + pointer (stdout only, never fails).
echo "legalsuite 2.0.0 installed to /usr/share/legalsuite (unsigned build)."
echo "Finish with: legalsuite-install --runtime auto \"\$HOME/.config/opencode\""
echo "Runtimes: python3 >=3.10 preferred, else node >=20 (the installer offers both)."
exit 0
