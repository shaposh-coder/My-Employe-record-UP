-- Run in NEW Supabase project (evoruzepcrzdnnbsmnyf) → SQL Editor → Run
-- Restores ORIGINAL passwords from old project (bcrypt hashes).

update auth.users set encrypted_password = '$2a$10$njeUU01WoHYFcvuC8QP4MuKLBF1RR0g0uzxZDFvTo0ZDcpUDYnsiK', updated_at = now()
where lower(trim(email)) = 'amian6413@gmail.com';

update auth.users set encrypted_password = '$2a$10$kJJ0lww3UXtlY4rAFzk9euzFK4IC0dAwicbwv3jxAwOWBCyHw0ZO2', updated_at = now()
where lower(trim(email)) = 'asm.shaposh@gmail.com';

update auth.users set encrypted_password = '$2a$10$33Dc7EIwJz6KxWFTa6w05OptwPjNnjhXlRTTlbgHqgKsIjovzH4b2', updated_at = now()
where lower(trim(email)) = 'abrehman455@gmail.com';

update auth.users set encrypted_password = '$2a$10$M3fjNMY9smhfsq81BvEAVupYd/C./6NwfXijFyucyFD4BHKEL7/l.', updated_at = now()
where lower(trim(email)) = 'qais_zam1@hotmail.com';

update auth.users set encrypted_password = '$2a$10$N./NsFdhgZujhYYwzeVnzuQs8imo.AIJQ3UHz/uhyN.b/DbYgb40W', updated_at = now()
where lower(trim(email)) = 'abdulahad925801@gmail.com';

update auth.users set encrypted_password = '$2a$10$dI5d0eQYZ8YcCPHFc..HQeYJpEWUjAHpkuvCu832BDG5KzShVy9ki', updated_at = now()
where lower(trim(email)) = 'hr@shaposh.pk';

update auth.users set encrypted_password = '$2a$06$Tn06tdsX5xG5CraavfPfJeJQv8KsPGepDmL9siatl5m2zpB9EA78e', updated_at = now()
where lower(trim(email)) = 'admin@admin.com';

update auth.users set encrypted_password = '$2a$10$Zc/V7h1HPg26/FEUhN2aTe/9vgSAvOFr8avyqMvi1FuVP6GPVC8Qu', updated_at = now()
where lower(trim(email)) = 'sabrirooman@gmail.com';

update auth.users set encrypted_password = '$2a$10$q2hIFALNtwhob/3SE3QcwuwOfF7/DhrUsqNIBE.8ScKDd2NYsELFG', updated_at = now()
where lower(trim(email)) = 'cfo@shaposh.pk';

update auth.users set encrypted_password = '$2a$10$uBFBK/EQTbs9xiY9EC1ile1oeT2NTIwrUD4y.HRRKEoiDepz5mRQ6', updated_at = now()
where lower(trim(email)) = 'maziz45@hotmail.com';
