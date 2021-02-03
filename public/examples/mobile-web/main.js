function handleError(errorMessage) {
    document.getElementById('error_notice_message').innerText = errorMessage
    document.body.classList = ['error']
}

function progressUpdate(updateMsg) {
    const el = document.getElementById('check_progress')
    const updateEl = document.createElement('div')
    updateEl.innerText = updateMsg
    el.append(updateEl)
}

function clearProgress() {
    document.getElementById('check_progress').innerHTML = ''
}

// Get coverage based on device IP.
async function checkCoverage() {
    document.body.classList = ['loading']
    clearProgress()

    console.log('requesting coverage')
    try {
        const deviceCoverageResult = await axios.get('/device', {
            validateStatus: function (status) {
                return status >= 200 && status <= 404;
            },
        })
        console.log(deviceCoverageResult)

        // If there's no coverage then prompt the user to turn off WiFi if it's enabled and recheck.
        if(deviceCoverageResult.status === 200) {
            // tru.ID has coverage
            document.body.classList = ['has-coverage']
        }
        else if(deviceCoverageResult.status === 404) {
            // No coverage
            document.body.classList = ['no-coverage']
        }
        else {
            handleError('Unexpected result from device coverage check.')
        }
    }
    catch(ex) {
        handleError('An error occurred while checking device coverage.')
    }
}

async function phoneCheckFormSubmit(ev) {
    ev.preventDefault()

    clearProgress()
    progressUpdate('Initiating Phone Verification')
    const phoneNumberEl = document.getElementById('phone_number')
    let phoneNumberValue = phoneNumberEl.value

    // strip spaces out of the phone number and replace within input
    phoneNumberValue = phoneNumberValue.replace(/\s+/g, '')
    phoneNumberEl.value = phoneNumberValue

    try {
        // Create PhoneCheck resource
        const phoneCheckCreateResult = await axios.post('/phone-check', {phone_number: phoneNumberValue})
        console.log(phoneCheckCreateResult)
        if(phoneCheckCreateResult.status === 200) {
            progressUpdate('Creating Mobile Data Session')

            // Execute the PhoneCheck
            const checkMethod = document.getElementById('check_method_image').checked? 'image': 'window'
            await tru.ID.openCheckUrl(phoneCheckCreateResult.data.check_url, {checkMethod: checkMethod, debug: true})

            // check_url has been navigated to and check completed.
            getPhoneCheckResult(phoneCheckCreateResult.data.check_id)
        }
        else {
            console.error(phoneCheckFormSubmit)
            handleError('An error occurred while creating a PhoneCheck.')
        }
    }
    catch(error) {
        console.error(error)
        handleError('An error occurred while creating a PhoneCheck.')
    }
}

async function getPhoneCheckResult(checkId) {
    try {
        // Retrieve the result and show the result
        const phoneCheckResult = await axios.get(`/phone-check?check_id=${checkId}`)
        console.log(phoneCheckResult)

        progressUpdate(`Phone Number Verified: ${phoneCheckResult.data.match? '✅': '❌'}`)
    }
    catch(error) {
        console.error(error)
        handleError('An error occurred while retrieving the PhoneCheck result.')
    }
}

document.getElementById('wifi_retry').addEventListener('click', checkCoverage, false)
document.getElementById('error_retry').addEventListener('click', checkCoverage, false)
document.getElementById('phone_check_form').addEventListener('submit', phoneCheckFormSubmit, false)

const browser = bowser.getParser(window.navigator.userAgent);
const info = `Browser: ${browser.getBrowserName()} ${browser.getBrowserVersion()} | OS: ${browser.getOSName()} ${browser.getOSVersion()}`
document.getElementById('device_info').innerText = info

checkCoverage()