// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


library PriceConverter {
    function getPrice(AggregatorV3Interface _priceFeed) internal view returns (uint256) {
        (, int256 answer, , , ) = _priceFeed.latestRoundData();
        return uint256 (answer * 1e10);
    }

    function getConversionRate(uint256 _ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint256) {
        uint256 oneEthPrice = getPrice(priceFeed);
        return uint256 (_ethAmount * oneEthPrice) / 1e18;
    }
}