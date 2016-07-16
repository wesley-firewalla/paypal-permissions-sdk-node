# Permissions SDK

The PayPal Permission SDK provides javascript APIs for developers to request and obtain permissions from merchants and consumers, to execute APIs on behalf of them. The permissions include variety of operations from processing payments to accessing account transaction history.

## Installation

```sh
$ npm install paypal-permissions-sdk
```

## Example

Request permission:

```js
let PermissionsApi = require('paypal-permissions-sdk')
let api = new PermissionsApi({
  mode: 'sandbox', // set "live" for production
  userId: 'xxx',
  password: 'xxx',
  signature: 'xxx',
  appId: 'APP-80W284485P519543T'
})

let scope = ['ACCESS_BASIC_PERSONAL_DATA', 'ACCESS_ADVANCED_PERSONAL_DATA', 'DIRECT_PAYMENT', 'REFUND', 'AUTH_CAPTURE']
let returnUrl = 'http://localhost:8082/oauth/token'
api.requestPermissions(scope, returnUrl, function(error, response){
  if (!error) {
    console.log(api.getGrantPermissionUrl(response.token))  // redirect url to grant permissions
  }
})
```

Make API call with `token` and `token_secret`:

```js
api.setAuth('token', 'token_secret')
let response = api.getBasicPersonalData(['full_name'], function(error, response){
  console.log(response)
})
```
