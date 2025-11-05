from web3 import Web3
from functools import lru_cache
from .config import settings


@lru_cache(maxsize=1)
def get_w3() -> Web3:
    rpc = settings.TESTNET_RPC_URL or settings.ETHEREUM_RPC_URL or "http://127.0.0.1:8545"
    return Web3(Web3.HTTPProvider(rpc))





