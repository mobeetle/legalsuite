#!/bin/sh
# /usr/bin/legalsuite-install (installed by .deb/.rpm): thin wrapper so the
# package entry point runs the same bootstrap as the tarball.
exec /usr/share/legalsuite/install.sh "$@"
