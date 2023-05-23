const date = require('date-and-time');
const config = require('../config/auction');

const getGroupId = (userChat) => {
   const groupObj = userChat
      .filter((chat) => chat.isGroup && chat.name === config.groupName)
      .map((chat) => {
         return {
            id: chat.id,
            name: chat.name,
         };
      });
   return groupObj[0].id.user + '@g.us';
};

const currentDateTime = () => {
   const currentDate = new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
   });
   return currentDate;
};

const addSomeMinutes = (minutes) => {
   const currentDate = new Date();
   const addMinutes = date.addMinutes(currentDate, minutes);
   const hourFormat = addMinutes.toLocaleString('id-ID', {
      timeStyle: 'short',
   });
   return hourFormat;
};

const generateCode = (num) => {
   if (num > 0 && num <= 20) {
      const alpha = Array.from(Array(num)).map((e, i) => i + 65);
      const alphabet = alpha.map((x) => String.fromCharCode(x));
      return alphabet;
   }
};

const isAdminBot = (message) => {
   const adminBot = config.admins.find((admin) => {
      return admin === message.rawData.from;
   });

   return adminBot;
};

module.exports = {
   getGroupId,
   currentDateTime,
   generateCode,
   addSomeMinutes,
   isAdminBot,
};
