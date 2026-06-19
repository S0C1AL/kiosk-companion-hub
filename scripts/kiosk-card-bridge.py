#!/usr/bin/env python3
"""
Kiosk PC/SC -> HTTP bridge.

Watches the ACS ACR122U (or any PC/SC reader) for card insert/remove events
and POSTs them to the kiosk app at http://127.0.0.1:3000/api/public/card-event.

Requires:
    sudo apt-get install -y pcscd pcsc-tools libpcsclite-dev python3-pip
    pip3 install --break-system-packages pyscard requests

Environment variables:
    KIOSK_APP_URL       default http://127.0.0.1:3000
    KIOSK_BRIDGE_SECRET optional shared secret; if set, also set the same
                        value in the app's environment.
"""
from __future__ import annotations

import os
import sys
import time
import logging

import requests
from smartcard.CardMonitoring import CardMonitor, CardObserver
from smartcard.util import toHexString
from smartcard.CardConnection import CardConnection

APP_URL = os.environ.get("KIOSK_APP_URL", "http://127.0.0.1:3000").rstrip("/")
ENDPOINT = f"{APP_URL}/api/public/card-event"
SECRET = os.environ.get("KIOSK_BRIDGE_SECRET")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("kiosk-card-bridge")


def post(payload: dict) -> None:
    headers = {"Content-Type": "application/json"}
    if SECRET:
        headers["Authorization"] = f"Bearer {SECRET}"
    try:
        r = requests.post(ENDPOINT, json=payload, headers=headers, timeout=3)
        if r.status_code >= 300:
            log.warning("POST %s -> %s %s", ENDPOINT, r.status_code, r.text[:200])
    except requests.RequestException as e:
        log.warning("POST %s failed: %s", ENDPOINT, e)


def read_uid(card) -> str | None:
    """Read the UID from a contactless card via ACR122 PC/SC pseudo-APDU."""
    try:
        conn = card.createConnection()
        conn.connect(CardConnection.T0_protocol | CardConnection.T1_protocol)
        # APDU: FF CA 00 00 00  (Get Data - UID)
        data, sw1, sw2 = conn.transmit([0xFF, 0xCA, 0x00, 0x00, 0x00])
        if (sw1, sw2) != (0x90, 0x00):
            log.warning("UID APDU returned SW=%02X%02X", sw1, sw2)
            return None
        return toHexString(data).replace(" ", "").upper()
    except Exception as e:
        log.warning("UID read failed: %s", e)
        return None
    finally:
        try:
            conn.disconnect()
        except Exception:
            pass


class Observer(CardObserver):
    def update(self, observable, actions):
        added, removed = actions
        for card in added:
            uid = read_uid(card)
            if uid:
                log.info("INSERT uid=%s", uid)
                post({"event": "insert", "uid": uid})
            else:
                log.info("INSERT (no uid)")
        for _ in removed:
            log.info("REMOVE")
            post({"event": "remove"})


def main() -> int:
    log.info("Starting kiosk-card-bridge -> %s", ENDPOINT)
    monitor = CardMonitor()
    observer = Observer()
    monitor.addObserver(observer)
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        pass
    finally:
        monitor.deleteObserver(observer)
    return 0


if __name__ == "__main__":
    sys.exit(main())