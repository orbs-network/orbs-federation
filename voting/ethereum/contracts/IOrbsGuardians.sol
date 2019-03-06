pragma solidity 0.5.3;


interface IOrbsGuardians {
    function register(string calldata name, string calldata website) external;
    function leave() external;
    function isGuardian(address guardian) external view returns (bool);
    function getGuardianData(address validator)
        external
        view
        returns (string memory name, string memory website);
    function getGuardians(uint offset, uint limit)
        external
        view
        returns (address[] memory);
}
