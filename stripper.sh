#!/usr/bin/env bash

node stripper.js ./build/contracts/ $1

# uncomment if you are doing this manully
#node stripper.js ./build/contracts/ ./Federation/build/contracts/*.json
#node stripper.js ./build/contracts/ ./TestingERC20/build/contracts/TestingERC20.json