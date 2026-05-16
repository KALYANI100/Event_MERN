const updateSystem = "sudo apt update && sudo apt upgrade -y";

const addNodeSource = "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -";

const installNode = "sudo apt install -y nodejs";
const fixKeyPermission = "chmod 400 Practice_key.pem";

const sshAzureVM = "ssh -i Practice_key.pem azureuser@<VMIP>";
