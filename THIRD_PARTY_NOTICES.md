# Third-Party Notices

`dsh-background-agents` is licensed under the Apache License 2.0 ([LICENSE](./LICENSE)).
It ships with the following third-party software:

## zod

- Source: https://github.com/colinhacks/zod
- License: MIT
- Copyright (c) 2020 Colin McDonnell

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.

zod is bundled (inlined) into both the node half (`lib/index.js`) and the
client bundle (`lib/client.js`).

## Development-only tooling

The following are used only to build and test this repository and are not
part of the shipped artifacts: TypeScript (Apache-2.0), tsdown (MIT),
vitest (MIT), lightningcss (MPL-2.0), and the `@types/*` stubs (MIT).
The test suite's scripted LLM adapter (`tests/mock-adapter.ts`) follows the
pattern of DeepSeek Harness's own agent-loop test adapter
(`packages/core/agent-loop/tests/mock-adapter.ts`), used under the same
Apache-2.0 terms as the harness.
