import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from dotenv import load_dotenv

# Ensure .env is loaded from the project root
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
load_dotenv(env_path)

logger = logging.getLogger("emolit.email")

def send_verification_email(user_email: str, verification_link: str):
    """
    Sends a premium branded verification email to the user.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_name = os.getenv("FROM_NAME", "Emolit")

    if not smtp_user or not smtp_pass:
        logger.error("❌ SMTP credentials missing in environment!")
        return False

    print(f"[EmailService] Attempting to send to {user_email} via {smtp_user}...")

    subject = "Verify your Emolit account"
    
    html_template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your Emolit account</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#FFF8DC;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;padding:52px 16px 60px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;">
        <tr><td style="padding:0 52px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><span style="font-family:'Playfair Display',Georgia,serif;font-size:34px;color:#3D2520;font-weight:700;letter-spacing:-0.5px;">Emo<em style="color:#674846;font-style:italic;">lit</em></span></td>
            <td align="right" style="vertical-align:middle;"><span style="font-size:9px;color:#A08070;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Arial,sans-serif;">Vol. I &nbsp;&#183;&nbsp; 2026</span></td>
          </tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="border-top:3px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:3px;"><tr><td style="border-top:1px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
      </table>
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-left:1px solid rgba(103,72,70,0.15);border-right:1px solid rgba(103,72,70,0.15);">
        <tr><td style="padding:52px 52px 0;">
          <p style="font-size:9px;color:#A08070;letter-spacing:5px;text-transform:uppercase;margin:0 0 28px;font-family:'Inter',Arial,sans-serif;font-weight:500;">&#8212; Account Verification &#8212;</p>
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:58px;color:#3D2520;margin:0;line-height:1.04;font-weight:700;letter-spacing:-2.5px;">
            Your story<br/>begins<br/><em style="font-style:italic;font-weight:400;color:#674846;font-size:62px;">here.</em>
          </h1>
        </td></tr>
        <tr><td style="padding:36px 52px 48px;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:26px;"><tr><td style="width:44px;border-top:2px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <p style="font-size:15px;color:#6B4E4A;line-height:1.9;margin:0 0 36px;font-weight:300;max-width:400px;font-family:'Inter',Arial,sans-serif;">
            Welcome to <strong style="color:#3D2520;font-weight:600;">Emolit</strong> &#8212; your personal space to understand, name, and grow through your emotions. One click and you&#8217;re in.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>
            <td style="background-color:#674846;">
              <a href="{{verification_link}}" style="display:inline-block;padding:20px 56px;font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:600;color:#FFF8DC;text-decoration:none;letter-spacing:3.5px;text-transform:uppercase;">Verify My Account</a>
            </td>
          </tr></table>
          <p style="font-size:11px;color:#BCA898;margin:0;font-family:'Inter',Arial,sans-serif;">Link expires in 24&#160;hours &#160;&#183;&#160; One-time use only</p>
        </td></tr>
        <tr><td style="padding:0 52px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid rgba(103,72,70,0.18);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
        <tr><td style="padding:32px 52px 28px;"><p style="font-size:9px;color:#A08070;letter-spacing:5px;text-transform:uppercase;margin:0;font-family:'Inter',Arial,sans-serif;font-weight:500;text-align:center;">Inside Emolit</p></td></tr>
        <tr><td style="padding:0 52px 52px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr valign="top">
            <td width="30%" style="padding-right:14px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:2px solid #674846;padding-top:20px;">
              <p style="font-family:'Playfair Display',Georgia,serif;font-size:28px;color:rgba(103,72,70,0.15);margin:0 0 10px;font-weight:700;line-height:1;">01</p>
              <p style="font-size:12px;color:#3D2520;font-weight:600;margin:0 0 7px;font-family:'Inter',Arial,sans-serif;">Emotion Mapping</p>
              <p style="font-size:11px;color:#A08070;margin:0;line-height:1.6;font-family:'Inter',Arial,sans-serif;">Understand your inner landscape</p>
            </td></tr></table></td>
            <td width="30%" style="padding-right:14px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:2px solid #674846;padding-top:20px;">
              <p style="font-family:'Playfair Display',Georgia,serif;font-size:28px;color:rgba(103,72,70,0.15);margin:0 0 10px;font-weight:700;line-height:1;">02</p>
              <p style="font-size:12px;color:#3D2520;font-weight:600;margin:0 0 7px;font-family:'Inter',Arial,sans-serif;">Daily Journaling</p>
              <p style="font-size:11px;color:#A08070;margin:0;line-height:1.6;font-family:'Inter',Arial,sans-serif;">Reflect, write, and grow daily</p>
            </td></tr></table></td>
            <td width="30%"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:2px solid #674846;padding-top:20px;">
              <p style="font-family:'Playfair Display',Georgia,serif;font-size:28px;color:rgba(103,72,70,0.15);margin:0 0 10px;font-weight:700;line-height:1;">03</p>
              <p style="font-size:12px;color:#3D2520;font-weight:600;margin:0 0 7px;font-family:'Inter',Arial,sans-serif;">Guided Growth</p>
              <p style="font-size:11px;color:#A08070;margin:0;line-height:1.6;font-family:'Inter',Arial,sans-serif;">Build lasting emotional strength</p>
            </td></tr></table></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:20px 52px;background-color:#FFFDF5;border-top:1px solid rgba(103,72,70,0.10);">
          <p style="font-size:12px;color:#BCA898;line-height:1.8;margin:0;font-family:'Inter',Arial,sans-serif;">
            Button not working? Copy and paste this link:<br/>
            <a href="{{verification_link}}" style="color:#674846;text-decoration:none;font-weight:500;word-break:break-all;">{{verification_link}}</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 52px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:3px;"><tr><td style="border-top:3px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="border-top:1px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
        <tr><td style="padding:0 52px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <p style="font-size:11px;color:#C4A898;margin:0 0 3px;font-family:'Inter',Arial,sans-serif;">Didn&#8217;t create this account? Simply ignore this email.</p>
              <p style="font-size:11px;color:#C4A898;margin:0;font-family:'Inter',Arial,sans-serif;">&#169; 2026 Emolit &#183; All rights reserved.</p>
            </td>
            <td align="right" style="vertical-align:middle;"><span style="font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:13px;color:#BCA898;">made with care &#9825;</span></td>
          </tr></table>
        </td></tr>
      </table>
      <p style="font-size:9px;color:#A08070;margin:22px 0 0;text-align:center;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Arial,sans-serif;">Emotional Intelligence for Everyone</p>
    </td></tr>
  </table>
</body>
</html>"""

    body = html_template.replace("{{verification_link}}", verification_link)

    msg = MIMEMultipart()
    msg['From'] = f"{from_name} <{smtp_user}>"
    msg['To'] = user_email
    msg['Bcc'] = smtp_user  # Send a copy to yourself to verify it's working
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        print(f"[EmailService] Connecting to {smtp_host}:{smtp_port}...")
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.set_debuglevel(1)  # Enable debug output to see the SMTP conversation
        server.starttls()
        server.login(smtp_user, smtp_pass)
        print(f"[EmailService] Logged in as {smtp_user}. Sending message...")
        server.send_message(msg)
        server.quit()
        print(f"[EmailService] ✅ SUCCESS: Verification email sent to {user_email}")
        return True
    except Exception as e:
        print(f"[EmailService] ❌ ERROR: Failed to send to {user_email}: {e}")
        logger.error(f"❌ Failed to send email to {user_email}: {e}")
        return False


def send_otp_email(user_email: str, otp_code: str):
    """
    Sends a premium branded password reset OTP email to the user.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_name = os.getenv("FROM_NAME", "Emolit")

    if not smtp_user or not smtp_pass:
        logger.error("❌ SMTP credentials missing in environment!")
        return False

    print(f"[EmailService] Attempting to send OTP to {user_email} via {smtp_user}...")

    subject = f"{otp_code} is your Emolit verification code"
    
    html_template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your Emolit password</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#FFF8DC;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;padding:52px 16px 60px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;">
        <tr><td style="padding:0 52px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><span style="font-family:'Playfair Display',Georgia,serif;font-size:34px;color:#3D2520;font-weight:700;letter-spacing:-0.5px;">Emo<em style="color:#674846;font-style:italic;">lit</em></span></td>
            <td align="right" style="vertical-align:middle;"><span style="font-size:9px;color:#A08070;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Arial,sans-serif;">Vol. I &nbsp;&#183;&nbsp; 2026</span></td>
          </tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="border-top:3px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:3px;"><tr><td style="border-top:1px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
      </table>
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-left:1px solid rgba(103,72,70,0.15);border-right:1px solid rgba(103,72,70,0.15);">
        <tr><td style="padding:52px 52px 0;">
          <p style="font-size:9px;color:#A08070;letter-spacing:5px;text-transform:uppercase;margin:0 0 28px;font-family:'Inter',Arial,sans-serif;font-weight:500;">&#8212; Security Check &#8212;</p>
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:58px;color:#3D2520;margin:0;line-height:1.04;font-weight:700;letter-spacing:-2.5px;">
            Reset your<br/>secure<br/><em style="font-style:italic;font-weight:400;color:#674846;font-size:62px;">access.</em>
          </h1>
        </td></tr>
        <tr><td style="padding:36px 52px 48px;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:26px;"><tr><td style="width:44px;border-top:2px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <p style="font-size:15px;color:#6B4E4A;line-height:1.9;margin:0 0 24px;font-weight:300;max-width:400px;font-family:'Inter',Arial,sans-serif;">
            Use the verification code below to authorize your password reset request.
          </p>
          
          <table cellpadding="0" cellspacing="0" style="margin:20px 0 28px;">
            <tr>
              <td style="background-color:#FFF8DC; border: 1.5px dashed #674846; padding: 18px 48px; text-align: center;">
                <span style="font-family:'Courier New',Courier,monospace; font-size:36px; font-weight:bold; color:#3D2520; letter-spacing:8px;">{{otp_code}}</span>
              </td>
            </tr>
          </table>

          <p style="font-size:11px;color:#BCA898;margin:0;font-family:'Inter',Arial,sans-serif;">Code expires in 5 minutes &#160;&#183;&#160; One-time use only</p>
        </td></tr>
        <tr><td style="padding:0 52px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid rgba(103,72,70,0.18);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
        <tr><td style="padding:20px 52px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <p style="font-size:11px;color:#C4A898;margin:0 0 3px;font-family:'Inter',Arial,sans-serif;">If you did not request a password reset, simply ignore this email.</p>
              <p style="font-size:11px;color:#C4A898;margin:0;font-family:'Inter',Arial,sans-serif;">&#169; 2026 Emolit &#183; All rights reserved.</p>
            </td>
            <td align="right" style="vertical-align:middle;"><span style="font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:13px;color:#BCA898;">made with care &#9825;</span></td>
          </tr></table>
        </td></tr>
      </table>
      <p style="font-size:9px;color:#A08070;margin:22px 0 0;text-align:center;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Arial,sans-serif;">Emotional Intelligence for Everyone</p>
    </td></tr>
  </table>
</body>
</html>"""

    body = html_template.replace("{{otp_code}}", otp_code)

    msg = MIMEMultipart()
    msg['From'] = f"{from_name} <{smtp_user}>"
    msg['To'] = user_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"[EmailService] ✅ SUCCESS: OTP email sent to {user_email}")
        return True
    except Exception as e:
        print(f"[EmailService] ❌ ERROR: Failed to send OTP to {user_email}: {e}")
        logger.error(f"❌ Failed to send OTP email to {user_email}: {e}")
        return False


def send_deletion_email(user_email: str, deletion_link: str):
    """
    Sends a premium branded account deletion verification email.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_name = os.getenv("FROM_NAME", "Emolit")

    if not smtp_user or not smtp_pass:
        logger.error("❌ SMTP credentials missing in environment!")
        return False

    print(f"[EmailService] Attempting to send deletion email to {user_email}...")

    subject = "Confirm permanent deletion of your Emolit account"
    
    html_template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Delete your Emolit account</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#FFF8DC;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;padding:52px 16px 60px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;">
        <tr><td style="padding:0 52px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><span style="font-family:'Playfair Display',Georgia,serif;font-size:34px;color:#3D2520;font-weight:700;letter-spacing:-0.5px;">Emo<em style="color:#674846;font-style:italic;">lit</em></span></td>
            <td align="right" style="vertical-align:middle;"><span style="font-size:9px;color:#A08070;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Arial,sans-serif;">Vol. I &nbsp;&#183;&nbsp; 2026</span></td>
          </tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="border-top:3px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:3px;"><tr><td style="border-top:1px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
      </table>
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-left:1px solid rgba(103,72,70,0.15);border-right:1px solid rgba(103,72,70,0.15);">
        <tr><td style="padding:52px 52px 0;">
          <p style="font-size:9px;color:#A08070;letter-spacing:5px;text-transform:uppercase;margin:0 0 28px;font-family:'Inter',Arial,sans-serif;font-weight:500;">&#8212; Security Request &#8212;</p>
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:52px;color:#3D2520;margin:0;line-height:1.04;font-weight:700;letter-spacing:-2.5px;">
            Farewell,<br/>and thank<br/><em style="font-style:italic;font-weight:400;color:#9E2A2B;font-size:56px;">you.</em>
          </h1>
        </td></tr>
        <tr><td style="padding:36px 52px 48px;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:26px;"><tr><td style="width:44px;border-top:2px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <p style="font-size:15px;color:#6B4E4A;line-height:1.9;margin:0 0 36px;font-weight:300;max-width:400px;font-family:'Inter',Arial,sans-serif;">
            You have requested to permanently delete your <strong style="color:#3D2520;font-weight:600;">Emolit</strong> account and purge all emotional journals, streak histories, and word logs. <strong>This action is irreversible and all your data will be permanently deleted from our servers.</strong>
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>
            <td style="background-color:#9E2A2B;">
              <a href="{{deletion_link}}" style="display:inline-block;padding:20px 56px;font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:600;color:#FFF8DC;text-decoration:none;letter-spacing:3.5px;text-transform:uppercase;">Permanently Delete Account</a>
            </td>
          </tr></table>
          <p style="font-size:11px;color:#BCA898;margin:0;font-family:'Inter',Arial,sans-serif;">Link expires in 15 minutes &#160;&#183;&#160; One-time use only</p>
        </td></tr>
        <tr><td style="padding:0 52px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid rgba(103,72,70,0.18);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
        <tr><td style="padding:20px 52px;background-color:#FFFDF5;border-top:1px solid rgba(103,72,70,0.10);">
          <p style="font-size:12px;color:#BCA898;line-height:1.8;margin:0;font-family:'Inter',Arial,sans-serif;">
            Button not working? Copy and paste this link:<br/>
            <a href="{{deletion_link}}" style="color:#9E2A2B;text-decoration:none;font-weight:500;word-break:break-all;">{{deletion_link}}</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 52px 40px;margin-top:20px;">
          <p style="font-size:11px;color:#C4A898;margin:0 0 3px;font-family:'Inter',Arial,sans-serif;">If you did not request this, please change your password immediately to protect your account.</p>
          <p style="font-size:11px;color:#C4A898;margin:0;font-family:'Inter',Arial,sans-serif;">&#169; 2026 Emolit &#183; All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    body = html_template.replace("{{deletion_link}}", deletion_link)

    msg = MIMEMultipart()
    msg['From'] = f"{from_name} <{smtp_user}>"
    msg['To'] = user_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"[EmailService] ✅ SUCCESS: Deletion verification email sent to {user_email}")
        return True
    except Exception as e:
        print(f"[EmailService] ❌ ERROR: Failed to send deletion verification to {user_email}: {e}")
        logger.error(f"❌ Failed to send deletion verification email to {user_email}: {e}")
        return False
