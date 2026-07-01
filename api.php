<?php
// Prevent hidden PHP HTML warnings from breaking the JSON payload
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$host = 'localhost';
$db_name = 'geckostore';
$username = 'root'; // Update if you have a specific DB password
$password = ''; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["success" => false, "error" => "Connection failed: " . $e->getMessage()]);
    exit();
}

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);

if (!is_array($input)) {
    $input = [];
}

$action = isset($input['action']) ? $input['action'] : (isset($_GET['action']) ? $_GET['action'] : '');

try {
    switch($action) {
        case 'getAll':
            // Users
            $users = $pdo->query("SELECT * FROM users")->fetchAll(PDO::FETCH_ASSOC);
            
            // Categories
            $categories = $pdo->query("SELECT * FROM categories")->fetchAll(PDO::FETCH_ASSOC);
            
            // Products
            $products = $pdo->query("SELECT * FROM products")->fetchAll(PDO::FETCH_ASSOC);
            
            // Orders
            $ordersRaw = $pdo->query("SELECT * FROM orders")->fetchAll(PDO::FETCH_ASSOC);
            $orders = [];
            foreach($ordersRaw as $o) {
                $o['items'] = is_string($o['items']) ? json_decode($o['items'], true) : $o['items'];
                $orders[] = $o;
            }

            // Comments
            $comments = [];
            try {
                $comments = $pdo->query("SELECT c.*, u.firstName, u.lastName FROM comments c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.date DESC")->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $comments = $pdo->query("SELECT * FROM comments ORDER BY date DESC")->fetchAll(PDO::FETCH_ASSOC);
            }

            echo json_encode([
                "users" => $users,
                "categories" => $categories,
                "products" => $products,
                "orders" => $orders,
                "comments" => $comments
            ]);
            break;

        case 'login':
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
            $stmt->execute([$input['email'], $input['password']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) echo json_encode(["success" => true, "user" => $user]);
            else echo json_encode(["success" => false, "error" => "Invalid email or password"]);
            break;

        case 'register':
            $u = $input['user'];
            $stmt = $pdo->prepare("SELECT email FROM users WHERE email = ?");
            $stmt->execute([$u['email']]);
            if($stmt->rowCount() > 0) {
                echo json_encode(["success" => false, "error" => "Email already registered!"]);
                break;
            }
            $stmt = $pdo->prepare("INSERT INTO users (email, password, role, firstName, lastName) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$u['email'], $u['password'], 'customer', $u['firstName'], $u['lastName']]);
            echo json_encode(["success" => true]);
            break;

        case 'updateProfile':
            $u = $input['user'];
            if (!empty($u['password'])) {
                $stmt = $pdo->prepare("UPDATE users SET firstName=?, lastName=?, phoneExt=?, phone=?, addr1=?, city=?, state=?, zip=?, country=?, password=? WHERE id=?");
                $stmt->execute([$u['firstName'], $u['lastName'], $u['phoneExt'], $u['phone'], $u['addr1'], $u['city'], $u['state'], $u['zip'], $u['country'], $u['password'], $u['id']]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET firstName=?, lastName=?, phoneExt=?, phone=?, addr1=?, city=?, state=?, zip=?, country=? WHERE id=?");
                $stmt->execute([$u['firstName'], $u['lastName'], $u['phoneExt'], $u['phone'], $u['addr1'], $u['city'], $u['state'], $u['zip'], $u['country'], $u['id']]);
            }
            echo json_encode(["success" => true]);
            break;
            
        case 'updateUserRole':
            $stmt = $pdo->prepare("UPDATE users SET role=? WHERE id=?");
            $stmt->execute([$input['role'], $input['id']]);
            echo json_encode(["success" => true]);
            break;

        case 'deleteUser':
            $stmt = $pdo->prepare("DELETE FROM users WHERE id=?");
            $stmt->execute([$input['id']]);
            echo json_encode(["success" => true]);
            break;

        case 'addCategory':
            $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (?)");
            $stmt->execute([$input['name']]);
            echo json_encode(["success" => true]);
            break;

        case 'deleteCategory':
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id=?");
            $stmt->execute([$input['id']]);
            echo json_encode(["success" => true]);
            break;

        case 'addProduct':
            $p = $input['product'];
            $stmt = $pdo->prepare("INSERT INTO products (name, price, stock, category_id, description, image) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$p['name'], $p['price'], $p['stock'], $p['category_id'], $p['desc'], '']);
            echo json_encode(["success" => true]);
            break;

        case 'updateProduct':
            $p = $input['product'];
            $stmt = $pdo->prepare("UPDATE products SET name=?, price=?, stock=?, category_id=?, description=? WHERE id=?");
            $stmt->execute([$p['name'], $p['price'], $p['stock'], $p['category_id'], $p['desc'], $p['id']]);
            echo json_encode(["success" => true]);
            break;

        case 'updateProductStock':
            // Safely subtract stock. GREATEST(0) prevents the stock from ever dropping below 0.
            $stmt = $pdo->prepare("UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?");
            $stmt->execute([$input['qty'], $input['id']]);
            echo json_encode(["success" => true]);
            break;

        case 'deleteProduct':
            $stmt = $pdo->prepare("DELETE FROM products WHERE id=?");
            $stmt->execute([$input['id']]);
            echo json_encode(["success" => true]);
            break;

        case 'addOrder':
            $o = $input['order'];
            $stmt = $pdo->prepare("INSERT INTO orders (user_id, total, status, paymentName, items) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$o['user_id'], $o['total'], 'Processing', $o['paymentName'], json_encode($o['items'])]);
            echo json_encode(["success" => true]);
            break;

        case 'updateOrderStatus':
            $stmt = $pdo->prepare("UPDATE orders SET status=? WHERE id=?");
            $stmt->execute([$input['status'], $input['id']]);
            echo json_encode(["success" => true]);
            break;

        case 'deleteOrder':
            $stmt = $pdo->prepare("DELETE FROM orders WHERE id=?");
            $stmt->execute([$input['id']]);
            echo json_encode(["success" => true]);
            break;

        case 'addComment':
            $c = $input['comment'];
            $stmt = $pdo->prepare("INSERT INTO comments (product_id, user_id, title, body) VALUES (?, ?, ?, ?)");
            $stmt->execute([$c['product_id'], $c['user_id'], $c['title'], $c['body']]);
            echo json_encode(["success" => true]);
            break;
            
        case 'getCart':
            try {
                $stmt = $pdo->prepare("SELECT cart FROM users WHERE id = ?");
                $stmt->execute([$input['user_id']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(["success" => true, "cart" => (!empty($user['cart']) ? json_decode($user['cart']) : [])]);
            } catch (Exception $e) {
                echo json_encode(["success" => true, "cart" => []]);
            }
            break;
    
        case 'updateCart':
            try {
                $stmt = $pdo->prepare("UPDATE users SET cart = ? WHERE id = ?");
                $stmt->execute([json_encode($input['cart']), $input['user_id']]);
                echo json_encode(["success" => true]);
            } catch (Exception $e) {
                echo json_encode(["success" => true]);
            }
            break;

        default:
            echo json_encode(["success" => false, "error" => "Invalid action."]);
            break;
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => "Database Query Error: " . $e->getMessage()]);
}
?>