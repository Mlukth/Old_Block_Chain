# 替换为你的实际目录路径（确保路径正确）
$folder = "D:\hardhat_resave\my-hardhat-project3\server\image_storage"

# 检查目录是否存在，不存在则创建
if (-not (Test-Path $folder)) {
    mkdir $folder | Out-Null
    Write-Host "已创建目录: $folder"
}

# 修复权限
Get-ChildItem $folder -Recurse | ForEach-Object {
    $acl = Get-Acl $_.FullName
    $permission = "Everyone", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
    $acl.AddAccessRule($accessRule)
    Set-Acl $_.FullName $acl
    Write-Host "修复权限: $($_.FullName)"
}

Write-Host "✅ 文件权限修复完成"