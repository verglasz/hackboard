#!/bin/sh
url='https://canvas.kth.se/api/v1/courses/34526/groups?include%5B%5D=users&include%5B%5D=group_category&include%5B%5D=permissions&include_inactive_users=true&per_page=100'

curl -b ~/tmp/canvascookies.txt "$url"

