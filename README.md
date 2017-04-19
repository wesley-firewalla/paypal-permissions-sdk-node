# Permissions SDK

The PayPal Permission SDK provides javascript APIs for developers to request and obtain permissions from merchants and consumers, to execute APIs on behalf of them. The permissions include variety of operations from processing payments to accessing account transaction history.

## Installation

```sh
$ npm install paypal-permissions-sdk --save
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
  if (error) {
    console.log(error.message)
  } else {
    console.log(api.getGrantPermissionUrl(response.token))  // redirect url to grant permissions
  }
})
```

Make API call with `token` and `token_secret`:

```js
api.getAccessToken('<request_token>', '<verification_code>', function(error, result){

  api.getPermissions(result.token, function (error, response) {
    console.log(response) // {"responseEnvelope":{"timestamp":"2016-07-19T02:09:21.094-07:00","ack":"Success","correlationId":"d97abd43aa319","build":"2210301"},"scope":["REFUND","DIRECT_PAYMENT","AUTH_CAPTURE","ACCESS_BASIC_PERSONAL_DATA","ACCESS_ADVANCED_PERSONAL_DATA"]}
  })

  api.cancelPermissions(result.token, function (error, response) {
    console.log(response) // {"responseEnvelope":{"timestamp":"2016-07-19T02:25:35.680-07:00","ack":"Success","correlationId":"d0a3e8f0985eb","build":"2210301"}}
  })

  api.setAuth(result.token, result.tokenSecret)
  api.getBasicPersonalData(function(error, response){
    console.log(response.person) // {"business_name":"xx","country":"US","email":"xx@xx.com","first_name":"xx","last_name":"xx","full_name":"xx xx","payer_id":"xxx"}
  })

  api.getAdvancedPersonalData(function(error, response){
    console.log(response.person) // {"business_name":"xx","country":"US","street1":"1 Main St","street2":"","city":"San Jose","state":"CA","postcode":"1234","phone":"1234","email":"xx@xx.com","first_name":"xx","last_name":"xx","full_name":"xx xx","payer_id":"xxx","date_of_birth":"19800802"}
  })
})
```

Actually you only need the email address when you want to do DIRECT_PAYMENT, you don't need to put X-PAYPAL-AUTHORIZATION in the paypal classic api. STUPID PAYPAL!!! Check this page http://stackoverflow.com/questions/10735258/using-the-x-paypal-authorization-header-for-transactionsearch-in-paypal

For more information about permissions api please check https://developer.paypal.com/docs/classic/api/#permissions

## License

[MIT](https://choosealicense.com/licenses/mit/)
