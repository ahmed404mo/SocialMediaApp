export const emailTemplate = ({ code, title }:{code:number, title:string}):string=> {
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2>${title}</h2>
      <p>Your confirmation code is:</p>
      <h1 style="color: #4CAF50; letter-spacing: 5px;">${code}</h1>
    </div>
  `;
};