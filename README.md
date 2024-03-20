# CPI Guard Lab

Repo showcasing the capabilities of the new CPI Guard Token extension.

The CPI Guard enables the following:
* Transfer: the signing authority must be the account delegate
* Burn: the signing authority must be the account delegate
* Approve: prohibited
* Close Account: the lamport destination must be the account owner
* Set Close Authority: prohibited unless unsetting
* Set Owner: always prohibited, including outside CPI
