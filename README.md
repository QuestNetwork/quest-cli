## Quest Network CLI
> The Future of Command Line Interfaces

## Lead Maintainer

[StationedInTheField](https://github.com/StationedInTheField)

## Note
If you wish to collaborate, check out [our issue list](https://github.com/QuestNetwork/quest-cli/issues).

**Warning:**
There's something wrong with how we use the path for the settings. Unfortunately we don't have the time to look into it right now, but it's safest (at least on Linux) to start the app from ```~/``` your home directory. If you can fix it, please contribute, the issue is: https://github.com/QuestNetwork/quest-cli/issues/1

## Prerequisites

Both the CLI and generated swarm projects have dependencies that require Node 8.9 or higher, together
with NPM 5.5.1 or higher.

## Table of Contents
* [Usage](#usage)
* [Package Requirements](#package-requirements)
* [Injecting Variables](#injecting-variables)
* [License](#license)

## Usage

Local installation:

```bash
node .
```

We recommend to edit and place the ```qc``` file in your ```/bin``` folder for global accessibility.

## Package Requirements

Since many different swarm packages have different deployment flows, we're calling the deploy and hibernate scripts from the respective package.json

Please make sure, your packages have npm compliant package.json files with a ```"deploy"``` and ```"hibernate"``` script.


## Injecting Variables

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
