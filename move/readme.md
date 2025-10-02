## Commands

# Deploy
```sh
aptos move deploy-object --profile default --address-name mooner_money --named-addresses admin=<admin_address_here>,thalaswap_v2=0xd50d3ba31df077e472ee2054062bac8fac80e97580e99c5983bbb759c7f37a5d --included-artifacts none 
```

# Upgrade
```sh
aptos move upgrade-object --address-name mooner_money --object-address <object_address> --named-addresses admin=<admin_address_here>,thalaswap_v2=0xd50d3ba31df077e472ee2054062bac8fac80e97580e99c5983bbb759c7f37a5d --included-artifacts none --profile default
```

# Object Address (development)
```sh
0x83a96247ab57ca2b4cac6934ec351e0a44b62dfe9220d4eec5a122715aeeb02f
```

- `thalaswap_v2_testnet - 0xd50d3ba31df077e472ee2054062bac8fac80e97580e99c5983bbb759c7f37a5d`


aptos move deploy-object --profile default --address-name mooner_money --named-addresses admin=0xc21eef93e0188165bc9f303e7f8b7f24064db5e6981d1cd092ee4a4b84ac38af,thalaswap_v2=0xd50d3ba31df077e472ee2054062bac8fac80e97580e99c5983bbb759c7f37a5d --included-artifacts none 

0xa8e8f55bc7ccb669fb7239167d4f34a60ffae14e22866ef5ecc92de55f2fe3b3

aptos move upgrade-object --address-name meowtos --object-address 0xa8e8f55bc7ccb669fb7239167d4f34a60ffae14e22866ef5ecc92de55f2fe3b3 --named-addresses admin=0xc21eef93e0188165bc9f303e7f8b7f24064db5e6981d1cd092ee4a4b84ac38af,thalaswap_v2=0xd50d3ba31df077e472ee2054062bac8fac80e97580e99c5983bbb759c7f37a5d --included-artifacts none --profile default
