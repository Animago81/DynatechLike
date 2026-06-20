#!/usr/bin/env bash
# DynaTech – Ein-Klick-Setup für einen Hetzner/Ubuntu/Debian-Server mit Caddy.
#
# Vor dem Ausführen die beiden Variablen GH_USER und GH_TOKEN setzen
# (GitHub-Benutzername + Personal Access Token mit "repo"-Scope), z. B.:
#   GH_USER=meinname GH_TOKEN=ghp_xxx sudo -E bash deploy/setup.sh
#
# Oder das Skript direkt ausführen – dann fragt es interaktiv danach.
set -euo pipefail

# --- Konfiguration ---------------------------------------------------------
REPO_PATH="Animago81/DynatechLike"
BRANCH="claude/dynatech-mobile-game-ak7egd"
DEST="/var/www/dynatech"
HOSTNAME_NIP="162-55-218-101.nip.io"   # = Server-IP 162.55.218.101
export DEBIAN_FRONTEND=noninteractive

SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

# --- Zugangsdaten ----------------------------------------------------------
GH_USER="${GH_USER:-}"
GH_TOKEN="${GH_TOKEN:-}"
[ -z "$GH_USER" ]  && read -rp  "GitHub-Benutzername: " GH_USER
[ -z "$GH_TOKEN" ] && { read -rsp "GitHub-Token (PAT): " GH_TOKEN; echo; }

echo "==> Caddy & Tools installieren ..."
$SUDO apt-get update -y
$SUDO apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl git gnupg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | $SUDO gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | $SUDO tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
$SUDO apt-get update -y
$SUDO apt-get install -y caddy

echo "==> Git-Zugangsdaten hinterlegen (für spätere Updates) ..."
HOME_DIR="$($SUDO sh -c 'echo $HOME')"
$SUDO git config --global credential.helper store
printf 'https://%s:%s@github.com\n' "$GH_USER" "$GH_TOKEN" \
  | $SUDO tee "$HOME_DIR/.git-credentials" >/dev/null
$SUDO chmod 600 "$HOME_DIR/.git-credentials"

echo "==> Code holen ..."
$SUDO mkdir -p /var/www
if [ -d "$DEST/.git" ]; then
  $SUDO git -C "$DEST" fetch origin "$BRANCH"
  $SUDO git -C "$DEST" checkout "$BRANCH"
  $SUDO git -C "$DEST" pull
else
  $SUDO git clone -b "$BRANCH" "https://github.com/$REPO_PATH.git" "$DEST"
fi
$SUDO chmod -R a+rX "$DEST"

echo "==> Caddy konfigurieren ..."
$SUDO cp "$DEST/deploy/Caddyfile" /etc/caddy/Caddyfile
$SUDO systemctl reload caddy 2>/dev/null || $SUDO systemctl restart caddy

echo
echo "Fertig!  ->  https://$HOSTNAME_NIP"
echo "(Zertifikat kann ~30s dauern. Logs: journalctl -u caddy -n 50)"
