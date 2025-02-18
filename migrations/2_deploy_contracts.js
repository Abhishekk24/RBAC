const CapabilityToken = artifacts.require("CapabilityToken");

module.exports = function (deployer) {
  deployer.deploy(CapabilityToken);
};
