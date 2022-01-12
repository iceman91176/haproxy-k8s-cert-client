# haproxy-k8s-cert-client

## Vorbereitung Kubernetes
Es muss ein Service-Account angelegt werden, der das Zertifikats-Secret lesen kann & alle Secrets im Namespace listen darf (sonst klappt der Watcher/Informer nicht)

Ein Beispiel hier

```
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: certificate-client-list-role
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["list","watch"]
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: certificate-client-s3
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: certificate-client-s3-role
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["s3-witcom-cloud-certificate-tls"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: certificate-client-s3-role-binding
subjects:
- kind: ServiceAccount
  name: certificate-client-s3
  namespace: cert-manager
roleRef:
  kind: Role
  name: certificate-client-s3-role
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: certificate-client-s3-list-role-binding
subjects:
- kind: ServiceAccount
  name: certificate-client-s3
  namespace: cert-manager
roleRef:
  kind: Role
  name: certificate-client-list-role
  apiGroup: rbac.authorization.k8s.io
```

Das Token kann aus dem Secret des Service-Accounts extrahiert werden.

## Installation

### Installation NodeJS
```
VERSION=v16.13.2-linux-x64
TMP=`mktemp -d`
cd $TMP
curl -sLO https://nodejs.org/dist/latest-v16.x/node-$VERSION.tar.gz
tar -xzf node-$VERSION.tar.gz
mv node-$VERSION /usr/src/node
ln -s /usr/src/node/bin/node /usr/bin/node
ln -s /usr/src/node/bin/npm /usr/bin/npm
ln -s /usr/src/node/bin/npx /usr/bin/npx
cd /
rm -rf $TMP
```

### Installation Applikation
```
mkdir -p /usr/src/cert-sync
git clone https://github.com/iceman91176/haproxy-k8s-cert-client.git /usr/src/cert-sync
cd /usr/src/cert-sync
npm install --production
chown -R haproxy:haproxy /usr/src/cert-sync/
```
## Installation als systemd unit
```
cp /usr/src/cert-sync/cert-sync.service /usr/lib/systemd/system/
systemctl daemon-reload
systemctl edit cert-sync
```

Da die Umgebungsvariablen anpassen
```
[Service]
Environment=K8S_SERVER=https://k8s01.xxx.yyy:6443
Environment=K8S_NAMESPACE=cert-manager
Environment=K8S_SERVICEACCOUNT=certificate-client-s3
Environment=K8S_TOKEN=das-token
Environment=CERT_SECRET=s3-witcom-cloud-certificate-tls
Environment=HAPROXY_CERTFILE=/tmp/cert.pem
```

```
systemctl enable cert-sync
systemctl start cert-sync
```

