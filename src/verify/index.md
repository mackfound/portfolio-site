---
layout: base.njk
title: Verify
description: "How to check that every page on mdoyle.dev was signed by Michael Doyle's key and arrived unchanged, using OpenSSH and a published manifest."
---
{#- Key values fall back to copy slots so deploy refuses until the key exists (P5). -#}
{%- set fingerprint = site.keyFingerprint or "TODO-COPY(verify-fingerprint)" -%}
{%- set signersLine = signing.allowedSigners or "TODO-COPY(verify-allowed-signers)" -%}
# Verify

Every page on this site is signed. When I publish, a script hashes every file the site serves (pages, stylesheets, and fonts) into a manifest, and I sign that manifest with an SSH key that never leaves my laptop. The footer of every page shows the commit it was built from and the key that signed it.

The steps below let you check this yourself: download the manifest and its signature, verify the signature against my public key, then compare a page’s hash with its line in the manifest. A page at `/writing/` is listed as `/writing/index.html`. If the hashes match, the bytes you received are the ones I approved.

Don’t take this page’s word for the key. The same fingerprint is on my GitHub profile, so check that the two agree before trusting either.

What this doesn’t prove: that the site was built from its public source code, or that my laptop wasn’t compromised. It proves that nothing changed between my machine and your browser.

Attestation is my central research focus, so why not apply its core idea, proving rather than asserting, at a micro level on my own site?

## Signing key

<div class="verify-key">
{% if site.keyFingerprint %}<figure class="art"><pre aria-hidden="true">{{ site.keyFingerprint | randomart }}</pre><figcaption>Signing key · ED25519</figcaption></figure>{% endif %}
<dl class="facts">
  <dt>Fingerprint</dt><dd><code>{{ fingerprint }}</code></dd>
  {% if site.links.github %}<dt>Also on</dt><dd><a href="{{ site.links.github }}">GitHub →</a></dd>{% endif %}
</dl>
</div>

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
