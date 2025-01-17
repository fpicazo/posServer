const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get all branches
router.get('/:tk', async (req, res) => {
    
    try {
        
        const { tk } = req.params;

        const tkr = await refresh_token_crm_update( tk );
        
        const consumir = axios.create({ baseURL: 'https://www.zohoapis.com/crm/v2.1/', headers: { 'Authorization': `Zoho-oauthtoken ${tkr.tko}` } });
        const respCM = await consumir.get('Empresas_Cursos');
        const record = respCM.data.data;
        res.status(200).json({ tk: tkr.tk, data: record });

    } catch (error) {
        // console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }

});  


const refresh_token_crm_update = async( tk ) => {

    const tko = order_data( tk );
    
    const epochTimeInSeconds = Math.floor(Date.now() / 1000);
    if( Number( tko.exp ) < epochTimeInSeconds ){
        const consumirRefreshToken = axios.create({ baseURL: 'https://accounts.zoho.com/oauth/v2/' });
        const respTR = await consumirRefreshToken.post('token?refresh_token=1000.e958b827d0ce27b405e47c5f8270a1b7.7bd3c073cddf5cf64f4b42d706e3f7e9&client_secret=7fbac496235d6d7d0b2190b02a304b4d58333c5a5f&client_id=1000.BG9KKAI44A9SWT4ODN80AF4YRTDL8I&grant_type=refresh_token');
        const exp = epochTimeInSeconds + respTR.data.expires_in;
        const strList = respTR.data.access_token.split('.');
        return {
            tk: `${exp}.${strList[1]}.${strList[2]}.${strList[0]}`,
            tko: respTR.data.access_token
        };

    }else{

        return {
            tk: tk,
            tko: tko.tk
        };

    }

};


const order_data = ( tkr ) => {

    const strList = tkr.split('.');
    return {
        tk: `${strList[3]}.${strList[1]}.${strList[2]}`,
        exp: strList[0]
    }

}


module.exports = router;
