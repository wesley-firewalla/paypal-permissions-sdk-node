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

// For scope values, check https://developer.paypal.com/docs/classic/api/permissions/GetPermissions_API_Operation
let scope = ['ACCESS_BASIC_PERSONAL_DATA', 'ACCESS_ADVANCED_PERSONAL_DATA', 'DIRECT_PAYMENT', 'REFUND', 'AUTH_CAPTURE']
let returnUrl = 'http://localhost:8082/token'
api.requestPermissions(scope, returnUrl, function(error, response){
  if (!error) {
    console.log(api.getGrantPermissionUrl(response.token))  // redirect url to grant permissions
  }
})
```


Get personal data api has to input `attributes`, possible values: `first_name`, `last_name`, `full_name`, `email`, 
`business_name`, `country`, `payer_id`, `date_of_birth`, `postcode`, `street1`, `street2`, `city`, `state`, `phone`.

Make API call with `token` and `token_secret`:

```js
api.getAccessToken('<request_token>', '<verification_code>', function(error, result){
	api.setAuth(result.token, result.tokenSecret)
	api.getBasicPersonalData(['first_name', 'last_name', 'full_name', 'email'], function(error, response){
	  console.log(response)
	})
})
```
