# Permissions SDK

The PayPal Permission SDK provides javascript APIs for developers to request and obtain permissions from merchants and consumers, to execute APIs on behalf of them. The permissions include variety of operations from processing payments to accessing account transaction history.

## Installation

```sh
$ npm install paypal-sdk-permissions-node
```

## Example

Request permission:

```js
let PermissionsApi = require('paypal-sdk-permissions')
let api = new PermissionsApi({
  mode: 'sandbox', // set "live" for production
  userId: 'xxx',
  password: 'xxx',
  signature: 'xxx',
  appId: 'APP-80W284485P519543T'
})

api.requestPermissions('AUTH_CAPTURE', 'http://localhost:8082/', function(error, response){
  if (!error) {
    console.log(api.getGrantPermissionUrl(response.token))  // redirect url to grant permissions
  }
})

```

Make API call with `token` and `token_secret`:

```js
api.setAuth('token', 'token_secret')

let response = api.GetBasicPersonalData()
```
