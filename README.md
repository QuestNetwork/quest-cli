## Quest Network CLI

<!-- Badges section here. -->
[![GitHub forks](https://img.shields.io/github/forks/angular/angular-cli.svg?style=social&label=Fork)](https://github.com/QuestNetwork/quest-cli/fork)
[![GitHub stars](https://img.shields.io/github/stars/angular/angular-cli.svg?style=social&label=Star)](https://github.com/QuestNetwork/quest-cli)


## Note
If you wish to collaborate, check out [our issue list](https://github.com/QuestNetwork/quest-cli/issues).

Before submitting new issues, have a look at [issues marked with the `type: faq` label](https://github.com/QuestNetwork/quest-cli/issues?utf8=%E2%9C%93&q=is%3Aissue%20label%3A%22type%3A%20faq%22%20).

## Prerequisites

Both the CLI and generated swarm projects have dependencies that require Node 8.9 or higher, together
with NPM 5.5.1 or higher.

## Table of Contents
* [Usage](#usage)
* [Injecting Variables](#injecting)
* [License](#license)

## Usage

```bash
node .
```

### Injecting Swarm Info

You can add arbitrary swarm info variables that will be copied into selected packages swarm.json:

```json
{
  "version": "0.9.1",
  "type": "swarmProject",
  "name": "myProject",
  "v8only": [
    "myContract",
    "myOtherContract",
  ],
  "combined": [
    "safeContract",
    "anotherSafeContract"
  ],
  "appKeys": {
    "secretKeyXPC": "MY_SECRET_KEY",
    "secretKeyLPG": "MY_OTHER_SECRET_KEYS"
  },
  "externalApiKey": "MY_EXERNAL_API_KEY",
  "packages": [
    "myContract",
    "myOtherContract",
    "safeContract",
    "anotherSafeContract",
  ],
  "injectInfo": [
    {
      "package": "myContract",
      "objects": [
        "version",
        "v8only",
        "combined",
        "appKeys"
      ],
      "scope": "global"
    },
    {
      "package": "safeContract",
      "objects": [
        "version",
        "externalApiKey"
      ]
    }
  ],
  "retrySettings": {
    "deploy": 2,
    "hibernate": 5
  }
}
```

This will add a custom swarm.json file with the listed objects into the respective packages.

Setting scope to global injects the selected objects into the swarm.json of the given package on deploy of every package.
This is useful when you're requiring this package in all the others, like a spam filter.

Without the scope, it will only inject the custom swarm.json for the given package on deploy of this given package.
This is useful if you're passing credentials that are specific to a certain package.

## License

[MIT](https://github.com/QuestNetwork/quest-cli/blob/master/LICENSE)