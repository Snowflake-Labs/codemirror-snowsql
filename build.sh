
set -ex

# build the lib
tsc

# Finally, copy some useful files into the distribution folder for documentation purposes.
cp ./README.md ./lib/README.md
cp ./CHANGELOG.md ./lib/CHANGELOG.md
cp ./LICENSE ./lib/LICENSE
cp ./package.json ./lib/package.json

