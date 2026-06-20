# DynaTech auf einem Hetzner-Server mit Caddy

Statische PWA hinter Caddy. Repo bleibt privat. Getestet für Ubuntu/Debian.

Platzhalter in dieser Anleitung:
- `DEINE_IP` – die öffentliche IPv4 deines Servers (z. B. `203.0.113.5`)
- `DEINE_IP_MIT_BINDESTRICHEN` – dieselbe IP mit `-` statt `.` (z. B. `203-0-113-5`)
- Branch: `claude/dynatech-mobile-game-ak7egd`

---

## 0. Firewall / Ports öffnen

Im **Hetzner-Cloud-Panel** (Firewall) und ggf. lokal Ports **80** und **443**
freigeben:

```bash
sudo ufw allow 80
sudo ufw allow 443
```

## 1. Caddy installieren

```bash
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

## 2. Code holen (privates Repo)

Du brauchst einmal einen **GitHub Personal Access Token** (PAT, „repo"-Scope):
GitHub → Settings → Developer settings → Personal access tokens.

```bash
sudo mkdir -p /var/www
sudo git clone -b claude/dynatech-mobile-game-ak7egd \
  https://github.com/Animago81/DynatechLike.git /var/www/dynatech
# Benutzername: dein GitHub-Name · Passwort: der PAT
sudo chmod -R a+rX /var/www/dynatech
```

> Token speichern, damit `git pull` später nicht erneut fragt:
> `sudo git -C /var/www/dynatech config credential.helper store` und einmal pullen.

## 3. Caddy konfigurieren

```bash
sudo cp /var/www/dynatech/deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile     # IP eintragen (siehe unten)
```

**Variante A (empfohlen, HTTPS + volle PWA):** In Variante A
`203-0-113-5.nip.io` durch `DEINE_IP_MIT_BINDESTRICHEN.nip.io` ersetzen.
`nip.io` löst jeden solchen Namen automatisch auf deine IP auf – Caddy holt
dann selbständig ein gültiges Let's-Encrypt-Zertifikat.

**Variante B (nur HTTP über IP):** Variante A auskommentieren, Variante B
einkommentieren. Kein Zertifikat, aber auch kein Installieren/Offline.

Neu laden:

```bash
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager   # läuft es? Fehler?
```

## 4. Aufrufen

- Variante A: `https://DEINE_IP_MIT_BINDESTRICHEN.nip.io`
- Variante B: `http://DEINE_IP`

Am Handy öffnen → Browser-Menü → **„Zum Startbildschirm hinzufügen"**
(nur Variante A) → läuft als App, auch offline.

---

## Updates einspielen

```bash
sudo git -C /var/www/dynatech pull
```

Mehr ist nicht nötig: Es sind statische Dateien, und der Service Worker lädt
dank „network-first" automatisch die neue Version. (Caddy muss nicht neu
gestartet werden, solange sich die Caddyfile nicht ändert.)

### Optional: Auto-Update per Cronjob

```bash
echo '*/5 * * * * root cd /var/www/dynatech && git pull -q' \
  | sudo tee /etc/cron.d/dynatech-update
```

## Fehlersuche

| Symptom | Prüfen |
|---|---|
| Seite nicht erreichbar | Ports 80/443 in Hetzner-Firewall offen? `systemctl status caddy` |
| Kein HTTPS-Zertifikat | Zeigt `DEINE_IP_MIT_BINDESTRICHEN.nip.io` wirklich auf die IP? `dig +short <name>` · Logs: `journalctl -u caddy -n 50` |
| Weiße Seite / Module laden nicht | Browser-Konsole prüfen; MIME-Typen liefert Caddy automatisch |
| Alte Version trotz Update | Einmal hart neu laden; danach aktualisiert der Service Worker selbst |
