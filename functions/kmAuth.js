const crypto = require('crypto');

const MOCK_USER_DATA = {
    imie: "Jan",
    nazwisko: "Kowalski",
    pesel: "90010112345", 
    
    ulica: "Piotrkowska",
    nrDomu: "100",
    miejscowosc: "Łódź",
    
    email: "jan.kowalski@test.pl",
    numerTelefonu: "123123123", 
    urlZdjecia: "osoba/mock_jan_k.jpg" 
};

function generateShaId(pesel) {
    return crypto.createHash('sha1').update(pesel).digest('hex');
}

handleMockLogin = (req, res) => {
    
    const userShaId = generateShaId(MOCK_USER_DATA.pesel);
    
    return res.status(200).send({
        success: true,
        user: MOCK_USER_DATA,
        
        userIdSha: userShaId, 
        
        tokens: { 
            access_token: "MOCK_TOKEN_12345", 
            refresh_token: "MOCK_REFRESH_TOKEN",
            ssoToken: "MOCK_SSO_TOKEN" 
        }
    });
};