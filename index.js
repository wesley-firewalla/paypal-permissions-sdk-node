'use strict'

const Client = require('node-rest-client').Client
const crypto = require('crypto')

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

const _basicPersonalDataAttributeNames = ['first_name', 'last_name', 'full_name',
  'email', 'business_name', 'country', 'payer_id']
const _advancedPersonalDataAttributeNames = [..._basicPersonalDataAttributeNames,
  'date_of_birth', 'postcode', 'street1', 'street2', 'city', 'state', 'phone']

const paypalUrlEncode = s => {
  const hex = '0123456789abcdef'
  const untouched = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_'
  const result = s.split('').map(function (c) {
    if (untouched.indexOf(c) >= 0) { return c; }
    else if (c == ' ') { return '+'; }else {
      const code = c.charCodeAt(0)
      return '%' + hex.charAt((code & 0xf0) >> 4) + hex.charAt(code & 0xf)
    }
  })
  return result.join('')
}

const invert = function (obj) {
  let newObj = {}

  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      newObj[obj[prop]] = prop
    }
  }

  return newObj
}

class PermissionsApi {

  constructor (config) {
    config = config || {}
    config.timeout = config.timeout || 15000
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

  _getThirdPartyAuthHeaders (httpMethod, action) {
    return {
      'X-PAYPAL-AUTHORIZATION': this.getAuthString(httpMethod, this._buildRequestUrl(action)),
      'X-PAYPAL-REQUEST-DATA-FORMAT': 'JSON',
      'X-PAYPAL-RESPONSE-DATA-FORMAT': 'JSON',
      'X-PAYPAL-APPLICATION-ID': this._config.appId,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  _sendRequest (action, requestData, callback) {
    let client = new Client()
    requestData.responseConfig = { timeout: this._config.timeout }
    const req = client.post(this._buildRequestUrl(action), requestData, function (data, response) {
      let err = null
      if (response.statusCode < 200 || response.statusCode >= 300) {
        err = new Error('Response Status : ' + response.statusCode)
        err.response = response
        err.httpStatusCode = response.statusCode
        response = null
      }

      if (data.responseEnvelope.ack === 'Failure'
        || data.responseEnvelope.ack === 'FailureWithWarning') {
        err = data.error[0]
      }

      callback(err, data)
    })

    req.on('requestTimeout', function (req) {
      callback('request has expired')
      req.abort()
    })

    req.on('responseTimeout', function (res) {
      callback('response has expired')
    })

    //it's usefull to handle request errors to avoid, for example, socket hang up errors on request timeouts
    req.on('error', callback)
  }

  _getAttributes (names) {
    return names.map(name => _attributes[name])
  }

  requestPermissions (scope, returnUrl, callback) {
    let args = {
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
    let args = {
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
    let args = {
      headers: this._getBasicHeaders(),
      data: {
        requestEnvelope: _requestEnvelope,
        token: token
      }
    }

    this._sendRequest('CancelPermissions', args, callback)
  }

  getPermissions (token, callback) {
    let args = {
      headers: this._getBasicHeaders(),
      data: {
        requestEnvelope: _requestEnvelope,
        token: token
      }
    }

    this._sendRequest('GetPermissions', args, callback)
  }

  setAuth (accessToken, tokenSecret) {
    this._auth = { accessToken: accessToken, tokenSecret: tokenSecret }
  }

  getAuthString (httpMethod, url) {
    if (!this._auth) {
      throw new Error('The accessToken and tokenSecret need to be set, please call "setAuth" method first.')
    }

    let params = {
      oauth_consumer_key: this._config.userId,
      oauth_version: '1.0',
      oauth_signature_method: 'HMAC-SHA1',
      oauth_token: this._auth.accessToken,
      oauth_timestamp: Math.round(Date.now() / 1000)
    }

    // Convert params into paramString
    let paramKeys = []
    for (let p in params) {
      paramKeys.push(p)
    }
    paramKeys.sort()

    let paramString = ''
    for (let i = 0; i < paramKeys.length; i += 1) {
      let key = paramKeys[i]
      paramString += (key + '=' + params[key])
      if (i + 1 < paramKeys.length) {
        paramString += '&'
      }
    }

    let key = paypalUrlEncode(this._config.password) + '&' + paypalUrlEncode(this._auth.tokenSecret)
    let signatureBase = httpMethod + '&' + paypalUrlEncode(url) + '&' + paypalUrlEncode(paramString)
    let signature = crypto.createHmac('sha1', key).update(signatureBase).digest().toString('base64')

    return `token=${this._auth.accessToken},signature=${signature},timestamp=${params.oauth_timestamp}`
  }

  _getPersonalData (attributeList, action, callback) {
    let args = {
      headers: this._getThirdPartyAuthHeaders('POST', action),
      data: {
        requestEnvelope: _requestEnvelope,
        attributeList: { attribute: this._getAttributes(attributeList) }
      }
    }

    this._sendRequest(action, args, function (error, response) {
      if (!error && response.response) {
        let personalData = response.response.personalData

        let invertedAttributes = invert(_attributes)
        let person = response.person = {}
        for (let data of personalData) {
          person[invertedAttributes[data.personalDataKey]] = data.personalDataValue
        }
      }
      callback(error, response)
    })
  }

  getBasicPersonalData (callback) {
    this._getPersonalData(_basicPersonalDataAttributeNames, 'GetBasicPersonalData', callback)
  }

  getAdvancedPersonalData (callback) {
    this._getPersonalData(_advancedPersonalDataAttributeNames, 'GetAdvancedPersonalData', callback)
  }
}

module.exports = PermissionsApi
