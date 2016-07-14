const Client = require('node-rest-client').Client

const _apiHosts = {
  live: 'svcs.paypal.com',
  sandbox: 'svcs.sandbox.paypal.com'
}

const _grantPermissionsUrls = {
  live: 'https://www.paypal.com/cgi-bin/webscr',
  sandbox: 'https://www.sandbox.paypal.com/cgi-bin/webscr'
}

const _requestEnvelope = { errorLanguage: 'en_US'}

const _attributes = {
  'first_name': 'http://axschema.org/namePerson/first',
  'last_name': 'http://axschema.org/namePerson/last',
  'email': 'http://axschema.org/contact/email',
  'full_name': 'http://schema.openid.net/contact/fullname',
  'business_name': 'http://axschema.org/company/name',
  'country': 'http://axschema.org/contact/country/home',
  'payer_id': 'https://www.paypal.com/webapps/auth/schema/payerID',
  'date_of_birth': 'http://axschema.org/birthDate',
  'postcode': 'http://axschema.org/contact/postalCode/home',
  'street1': 'http://schema.openid.net/contact/street1',
  'street2': 'http://schema.openid.net/contact/street2',
  'city': 'http://axschema.org/contact/city/home',
  'state': 'http://axschema.org/contact/state/home',
  'phone': 'http://axschema.org/contact/phone/default'
}

class PermissionsApi {

  constructor (config) {
    this._config = config
  }

  _buildRequestUrl (action) {
    return `https://${_apiHosts[this._config.mode]}/Permissions/${action}`
  }

  _getBasicHeaders () {
    return {
      'X-PAYPAL-SECURITY-USERID': this._config.userId,
      'X-PAYPAL-SECURITY-PASSWORD': this._config.password,
      'X-PAYPAL-SECURITY-SIGNATURE': this._config.signature,
      'X-PAYPAL-REQUEST-DATA-FORMAT': 'JSON',
      'X-PAYPAL-RESPONSE-DATA-FORMAT': 'JSON',
      'X-PAYPAL-APPLICATION-ID': this._config.appId,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  _sendRequest (action, requestData, callback) {
    let client = new Client()
    client.post(this._buildRequestUrl(action), requestData, function (data, response) {
      let err = null
      if (response.statusCode < 200 || response.statusCode >= 300) {
        err = new Error('Response Status : ' + response.statusCode)
        err.response = response
        err.httpStatusCode = response.statusCode
        response = null
      }
      callback(err, data)
    })
  }

  _getAttributes (names) {
    let list = []
    for (let name of names) {
      list.push({ attribute: _attributes[name] })
    }

    return list
  }

  requestPermissions (scope, returnUrl, callback) {
    var args = {
      headers: this._getBasicHeaders(),
      data: {
        requestEnvelope: _requestEnvelope,
        scope: scope,
        callback: returnUrl
      }
    }

    this._sendRequest('RequestPermissions', args, callback)
  }

  getGrantPermissionUrl (token) {
    return `${_grantPermissionsUrls[this._config.mode]}?cmd=_grant-permission&request_token=${token}`
  }

  getAccessToken (requestToken, verificationCode, callback) {
    var args = {
      headers: this._getBasicHeaders(),
      data: {
        requestEnvelope: _requestEnvelope,
        token: requestToken,
        verifier: verificationCode
      }
    }

    this._sendRequest('GetAccessToken', args, callback)
  }

  cancelPermissions (token, callback) {
    var args = {
      headers: this._getBasicHeaders(),
      data: {
        requestEnvelope: _requestEnvelope,
        token: token
      }
    }

    this._sendRequest('CancelPermissions', args, callback)
  }

  getPermissions (token, callback) {
    var args = {
      headers: this._getBasicHeaders(),
      data: {
        requestEnvelope: _requestEnvelope,
        token: token
      }
    }

    this._sendRequest('GetPermissions', args, callback)
  }

  setAuth (token, tokenSecret) {
    this._auth = { token, tokenSecret}
  }

  getBasicPersonalData (attributeList, callback) {
    var args = {
      headers: this._getBasicHeaders(),
      data: {
        requestEnvelope: _requestEnvelope,
        attributeList: this._getAttributes(attributeList)
      }
    }

    this._sendRequest('GetBasicPersonalData', args, callback)
  }

  getAdvancedPersonalData (attributeList, callback) {
    var args = {
      headers: this._getBasicHeaders(),
      data: {
        requestEnvelope: _requestEnvelope,
        attributeList: this._getAttributes(attributeList)
      }
    }

    this._sendRequest('GetAdvancedPersonalData', args, callback)
  }

}

module.exports = PermissionsApi
