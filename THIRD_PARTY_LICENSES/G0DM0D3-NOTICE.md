# G0DM0D3 third-party source notice

The standalone G0DM0D3 frontend is included at `android/app/src/main/assets/g0dm0d3/index.html`.

- Upstream project: https://github.com/elder-plinius/G0DM0D3
- Upstream source file: https://github.com/elder-plinius/G0DM0D3/blob/main/index.html
- Source blob SHA at import: `bf3926dacb6bf75cdbdb639e01c1dd9657565dad`
- License: GNU Affero General Public License v3.0 (AGPL-3.0); see `G0DM0D3-LICENSE`.

This integration vendors the standalone HTML frontend only. The optional upstream Express API server and its hosting/deployment infrastructure are not embedded in the Android APK. Model requests go to the provider/local endpoint configured by the user, and require a compatible endpoint and credentials where applicable.

This application contains modified/combined components. When distributing the APK or making a modified version available over a network, review and comply with AGPL-3.0 obligations, including providing the corresponding source and license notices. Keep this notice with redistributions.
