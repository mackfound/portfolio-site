---
layout: base.njk
title: Verify
metaSlot: verify
---
{#- Key values fall back to copy slots so deploy refuses until the key exists (P5). -#}
{%- set fingerprint = site.keyFingerprint or "TODO-COPY(verify-fingerprint)" -%}
{%- set signersLine = signing.allowedSigners or "TODO-COPY(verify-allowed-signers)" -%}
# Verify

TODO-COPY(verify-explainer)

## Signing key

<dl class="facts">
  <dt>Fingerprint</dt><dd><code>{{ fingerprint }}</code></dd>
  {% if site.links.github %}<dt>Also on</dt><dd><a href="{{ site.links.github }}">GitHub →</a></dd>{% endif %}
</dl>

## 1. Download the manifest and its signature

```sh
curl -O {{ site.url }}/manifest.txt
curl -O {{ site.url }}/manifest.txt.sig
```

## 2. Save the public key

```sh
echo '{{ signersLine | safe }}' > allowed_signers
```

## 3. Check the signature

```sh
ssh-keygen -Y verify -f allowed_signers -I michael -n mdoyle-site \
  -s manifest.txt.sig < manifest.txt
```

## 4. Check a page against the manifest

```sh
curl -s {{ site.url }}/ | shasum -a 256
grep ' /index.html$' manifest.txt
```
